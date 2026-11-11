'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { AuthError, checkPassword, clientIp, endAdminSession, getAdmin, hashPassword, isThrottled, recordAttempt, requireAdmin, startAdminSession, type Admin } from '@/lib/auth';
import { getContent, setContent, DEFAULTS } from '@/lib/content';
import { updateOrderStatus, updatePaymentStatus } from '@/lib/orders';
import { slugify, STATUSES } from '@/lib/format';

export type Res = { ok: boolean; message?: string; errors?: Record<string, string>; redirect?: string };

/** Wraps every admin action: permission check, validation errors, friendly messages, live-site refresh */
async function run(area: string, fn: (a: Admin) => Promise<Res | void>): Promise<Res> {
  try {
    const a = await requireAdmin(area);
    const r = await fn(a);
    revalidatePath('/', 'layout');
    return r || { ok: true, message: 'Saved' };
  } catch (e: any) {
    if (e instanceof z.ZodError) return { ok: false, message: 'Please check the highlighted fields.', errors: Object.fromEntries(e.issues.map(i => [String(i.path[0]), i.message])) };
    if (e instanceof AuthError) return { ok: false, message: e.message };
    if (e?.code === '23505') return { ok: false, message: 'That name or web address is already in use — please choose another.' };
    console.error(e);
    return { ok: false, message: e?.message && e.message.length < 200 ? e.message : 'Something went wrong. Please try again.' };
  }
}
const str = (max = 200) => z.string().trim().max(max);
const req = (label: string, max = 200) => z.string().trim().min(1, `${label} is required`).max(max);
const bool = (fd: FormData, k: string) => fd.get(k) === '1' || fd.get(k) === 'on';
const json = <T,>(fd: FormData, k: string, d: T): T => { try { const v = fd.get(k); return v ? JSON.parse(String(v)) : d; } catch { return d; } };
const uuid = z.string().uuid();
const money = (label: string) => z.coerce.number({ error: `${label} must be a number` }).min(0, `${label} can’t be negative`).max(10000000);
const optMoney = z.preprocess(v => (v === '' || v == null ? null : v), z.coerce.number().min(0).max(10000000).nullable());
const href = z.string().trim().max(300).refine(v => v === '' || v.startsWith('/') || /^https?:\/\//.test(v), 'Links must start with / or https://');

// =============== auth ===============
export async function adminLogin(_: Res | null, fd: FormData): Promise<Res> {
  const email = String(fd.get('email') || '').trim().toLowerCase(); const pw = String(fd.get('password') || '');
  if (!email || !pw) return { ok: false, message: 'Please enter your email and password.' };
  const ip = await clientIp();
  if (await isThrottled('admin', email, ip)) return { ok: false, message: 'Too many failed attempts. Please wait 15 minutes and try again.' };
  const [u] = await sql`select id, role, password_hash, active, session_version from admin_users where email = ${email}`;
  const ok = !!u && u.active && await checkPassword(pw, u.password_hash);
  await recordAttempt('admin', email, ip, ok);
  if (!ok) return { ok: false, message: 'Email or password is incorrect.' };
  await sql`update admin_users set last_login_at = now() where id = ${u.id}`;
  await startAdminSession(u as any);
  redirect('/admin');
}
export async function adminLogout() { await endAdminSession(); redirect('/admin/login'); }

export async function changeOwnPassword(_: Res | null, fd: FormData): Promise<Res> {
  return run('dashboard', async a => {
    const s = z.object({ current: z.string().min(1, 'Enter your current password'), next: z.string().min(10, 'Use at least 10 characters').max(200), confirm: z.string() })
      .refine(d => d.next === d.confirm, { message: 'Passwords do not match', path: ['confirm'] }).parse(Object.fromEntries(fd));
    const [u] = await sql`select password_hash from admin_users where id = ${a.id}`;
    if (!await checkPassword(s.current, u.password_hash)) return { ok: false, message: 'Your current password is incorrect.', errors: { current: 'Incorrect password' } };
    const [r] = await sql`update admin_users set password_hash = ${await hashPassword(s.next)}, session_version = session_version + 1 where id = ${a.id} returning id, role, session_version`;
    await startAdminSession(r as any); // other devices are signed out
    return { ok: true, message: 'Password updated. Other devices have been signed out.' };
  });
}

// =============== products ===============
const productSchema = z.object({
  name: req('Name', 120), slug: str(80), description: str(5000), details: str(3000), heel: str(80), material: str(120),
  price: z.coerce.number({ error: 'Enter a price' }).positive('Enter a price above 0').max(10000000), sale_price: optMoney, sort_order: z.coerce.number().int().min(-9999).max(9999).default(0)
});
const colorsSchema = z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Colours must be hex codes like #1E1A18') })).max(20);
const variantsSchema = z.array(z.object({ color: z.string().trim().min(1).max(40), size: z.number().int().min(35).max(42), stock: z.number().int().min(0).max(100000) })).max(400);

async function saveProduct(fd: FormData, id?: string): Promise<Res> {
  const d = productSchema.parse(Object.fromEntries(fd));
  if (d.sale_price != null && d.sale_price >= d.price) return { ok: false, message: 'The sale price must be lower than the regular price.', errors: { sale_price: 'Must be lower than the regular price' } };
  const colors = colorsSchema.parse(json(fd, 'colors', []));
  if (!colors.length) return { ok: false, message: 'Add at least one colour.' };
  if (new Set(colors.map(c => c.name.toLowerCase())).size !== colors.length) return { ok: false, message: 'Each colour needs a different name.' };
  const variants = variantsSchema.parse(json(fd, 'variants', []));
  if (!variants.length) return { ok: false, message: 'Choose at least one size.' };
  const images = z.array(uuid).max(20).parse(json(fd, 'images', []));
  const cats = z.array(uuid).parse(fd.getAll('categories').map(String));
  const slug = slugify(d.slug || d.name);
  if (!slug) return { ok: false, message: 'Please enter a product name.' };
  const flags = { is_new: bool(fd, 'is_new'), is_bestseller: bool(fd, 'is_bestseller'), is_featured: bool(fd, 'is_featured'), active: bool(fd, 'active') };
  const row = { name: d.name, slug, description: d.description, details: d.details, heel: d.heel, material: d.material, price: d.price, sale_price: d.sale_price, sort_order: d.sort_order, ...flags };
  const pid = await sql.begin(async (tx: any) => {
    let pid = id;
    if (id) await tx`update products set ${tx(row)}, updated_at = now() where id = ${id}`;
    else pid = (await tx`insert into products ${tx(row)} returning id`)[0].id;
    await tx`delete from product_images where product_id = ${pid}`;
    for (const [i, img] of images.entries()) await tx`insert into product_images values (${pid}, ${img}, ${i})`;
    await tx`delete from product_categories where product_id = ${pid}`;
    for (const c of cats) await tx`insert into product_categories values (${pid}, ${c}) on conflict do nothing`;
    await tx`delete from product_colors where product_id = ${pid}`;
    for (const [i, c] of colors.entries()) await tx`insert into product_colors (product_id, name, hex, sort_order) values (${pid}, ${c.name}, ${c.hex}, ${i})`;
    // upsert variants so that order history keeps pointing at the same rows
    const keep: string[] = [];
    for (const v of variants) {
      const [r] = await tx`insert into product_variants (product_id, color, size, stock, sku) values (${pid}, ${v.color}, ${v.size}, ${v.stock}, ${`${slug.slice(0, 12).toUpperCase()}-${v.color.slice(0, 3).toUpperCase()}-${v.size}`})
                          on conflict (product_id, color, size) do update set stock = excluded.stock returning id`;
      keep.push(r.id);
    }
    await tx`delete from product_variants where product_id = ${pid} and not (id = any(${keep}::uuid[]))`;
    return pid;
  });
  return id ? { ok: true, message: 'Product saved — the website has been updated.' } : { ok: true, message: 'Product created.', redirect: `/admin/products/${pid}` };
}
export async function createProduct(_: Res | null, fd: FormData) { return run('products', () => saveProduct(fd)); }
export async function updateProduct(id: string, _: Res | null, fd: FormData) { return run('products', () => saveProduct(fd, uuid.parse(id))); }
export async function deleteProduct(id: string) {
  return run('products', async () => { await sql`delete from products where id = ${uuid.parse(id)}`; return { ok: true, message: 'Product deleted.', redirect: '/admin/products' }; });
}
export async function toggleProduct(id: string, field: 'active' | 'is_new' | 'is_bestseller' | 'is_featured') {
  return run('products', async () => {
    if (!['active', 'is_new', 'is_bestseller', 'is_featured'].includes(field)) throw new Error('Unknown field');
    const [r] = await sql`update products set ${sql(field)} = not ${sql(field)}, updated_at = now() where id = ${uuid.parse(id)} returning name, ${sql(field)} as v`;
    const label = { active: 'Active', is_new: 'New Arrival', is_bestseller: 'Bestseller', is_featured: 'Featured' }[field];
    return { ok: true, message: `${r.name}: ${label} ${r.v ? 'on' : 'off'}` };
  });
}
export async function duplicateProduct(id: string) {
  return run('products', async () => {
    const pid = await sql.begin(async (tx: any) => {
      const [p] = await tx`select * from products where id = ${uuid.parse(id)}`;
      const [n] = await tx`insert into products (name, slug, description, details, price, sale_price, heel, material, active, sort_order)
        values (${p.name + ' (copy)'}, ${p.slug + '-copy-' + Date.now().toString(36)}, ${p.description}, ${p.details}, ${p.price}, ${p.sale_price}, ${p.heel}, ${p.material}, false, ${p.sort_order}) returning id`;
      await tx`insert into product_images select ${n.id}, image_id, sort_order from product_images where product_id = ${p.id}`;
      await tx`insert into product_categories select ${n.id}, category_id from product_categories where product_id = ${p.id}`;
      await tx`insert into product_colors (product_id, name, hex, sort_order) select ${n.id}, name, hex, sort_order from product_colors where product_id = ${p.id}`;
      await tx`insert into product_variants (product_id, color, size, stock) select ${n.id}, color, size, 0 from product_variants where product_id = ${p.id}`;
      return n.id;
    });
    return { ok: true, message: 'Copy created (hidden, stock set to 0).', redirect: `/admin/products/${pid}` };
  });
}

// =============== categories ===============
const catSchema = z.object({ name: req('Name', 80), slug: str(80), description: str(1000), sort_order: z.coerce.number().int().default(0), image_id: z.string().optional() });
async function saveCategory(fd: FormData, id?: string): Promise<Res> {
  const d = catSchema.parse(Object.fromEntries(fd));
  const slug = slugify(d.slug || d.name);
  if (['all', 'new-arrivals', 'best-sellers', 'featured', 'sale'].includes(slug)) return { ok: false, message: 'That web address is reserved — please choose another.', errors: { slug: 'Reserved' } };
  const row = { name: d.name, slug, description: d.description, sort_order: d.sort_order, image_id: d.image_id ? uuid.parse(d.image_id) : null, show_in_nav: bool(fd, 'show_in_nav'), show_on_home: bool(fd, 'show_on_home'), active: bool(fd, 'active') };
  if (id) { await sql`update categories set ${sql(row)} where id = ${id}`; return { ok: true, message: 'Category saved.' }; }
  await sql`insert into categories ${sql(row)}`;
  return { ok: true, message: 'Category created.', redirect: '/admin/categories' };
}
export async function createCategory(_: Res | null, fd: FormData) { return run('categories', () => saveCategory(fd)); }
export async function updateCategory(id: string, _: Res | null, fd: FormData) { return run('categories', () => saveCategory(fd, uuid.parse(id))); }
export async function deleteCategory(id: string) {
  return run('categories', async () => { await sql`delete from categories where id = ${uuid.parse(id)}`; return { ok: true, message: 'Category deleted. Its products were kept.', redirect: '/admin/categories' }; });
}
export async function setCategoryProducts(id: string, _: Res | null, fd: FormData) {
  return run('categories', async () => {
    const ids = z.array(uuid).parse(fd.getAll('products').map(String));
    await sql.begin(async (tx: any) => {
      await tx`delete from product_categories where category_id = ${uuid.parse(id)}`;
      for (const p of ids) await tx`insert into product_categories values (${p}, ${id}) on conflict do nothing`;
    });
    return { ok: true, message: `Category now has ${ids.length} products.` };
  });
}

// =============== inventory ===============
export async function saveStock(_: Res | null, fd: FormData) {
  return run('inventory', async () => {
    const updates = [...fd.entries()].filter(([k]) => k.startsWith('v_')).map(([k, v]) => ({ id: uuid.parse(k.slice(2)), stock: z.coerce.number().int().min(0).max(100000).parse(v) }));
    let changed = 0;
    await sql.begin(async (tx: any) => { for (const u of updates) { const r = await tx`update product_variants set stock = ${u.stock} where id = ${u.id} and stock <> ${u.stock}`; changed += r.count; } });
    return { ok: true, message: changed ? `Stock updated for ${changed} ${changed === 1 ? 'size' : 'sizes'}.` : 'No changes to save.' };
  });
}

// =============== orders ===============
export async function setOrderStatus(id: string, _: Res | null, fd: FormData) {
  return run('orders', async a => {
    const status = z.enum(STATUSES).parse(fd.get('status'));
    const note = str(1000).parse(fd.get('note') || '');
    await updateOrderStatus(uuid.parse(id), status, a.name, note || undefined);
    return { ok: true, message: `Order updated to “${status}”.` };
  });
}
export async function setPaymentStatus(id: string, payment: string) {
  return run('orders', async a => { await updatePaymentStatus(uuid.parse(id), z.enum(['unpaid', 'paid', 'refunded']).parse(payment), a.name); return { ok: true, message: `Payment marked as ${payment}.` }; });
}

// =============== homepage & content ===============
const sectionSchemas: Record<string, (fd: FormData) => any> = {
  announcements: fd => z.array(str(160)).max(10).parse(String(fd.get('announcements') || '').split('\n').map(s => s.trim()).filter(Boolean)),
  hero: fd => z.object({ eyebrow: str(120), heading: req('Heading', 120), heading_accent: str(120), subheading: str(300), image_id: z.string().optional(),
    primary_label: str(40), primary_href: href, secondary_label: str(40), secondary_href: href }).parse(Object.fromEntries(fd)),
  sections: fd => ({ ...z.object({ categories_eyebrow: str(80), categories_title: str(80), bestsellers_eyebrow: str(80), bestsellers_title: str(80), new_eyebrow: str(80), new_title: str(80), new_text: str(400), featured_eyebrow: str(80), featured_title: str(80) }).parse(Object.fromEntries(fd)), show_featured: bool(fd, 'show_featured') }),
  editorial: fd => z.object({ eyebrow: str(80), heading: str(80), heading_accent: str(80), heading_end: str(80), text: str(400), button_label: str(40), button_href: href, image_id: z.string().optional() }).parse(Object.fromEntries(fd)),
  story: fd => ({ ...z.object({ eyebrow: str(80), heading: str(160), heading_accent: str(120), body: str(4000), button_label: str(40), button_href: href, image_a: z.string().optional(), image_b: z.string().optional() }).parse(Object.fromEntries(fd)),
    stats: z.array(z.object({ value: str(20), label: str(60) })).max(3).parse(json(fd, 'stats', [])) }),
  promo: fd => ({ ...z.object({ eyebrow: str(80), heading: str(120), heading_accent: str(80), text: str(400), button_label: str(40), button_href: href, note: str(120), image_id: z.string().optional() }).parse(Object.fromEntries(fd)), visible: bool(fd, 'visible') }),
  trust: fd => z.array(z.object({ title: str(60), text: str(120) })).max(4).parse(json(fd, 'items', [])),
  why: fd => z.array(z.object({ title: str(60), text: str(240) })).max(4).parse(json(fd, 'items', [])),
  instagram: fd => ({ ...z.object({ title: str(80), text: str(200) }).parse(Object.fromEntries(fd)), image_ids: z.array(uuid).max(6).parse(json(fd, 'image_ids', [])) }),
  newsletter: fd => z.object({ eyebrow: str(80), heading: str(120), heading_accent: str(80), text: str(300) }).parse(Object.fromEntries(fd)),
  faqs: fd => z.array(z.object({ q: req('Question', 300), a: req('Answer', 3000) })).max(60).parse(json(fd, 'items', []))
};
export async function saveSection(key: string, _: Res | null, fd: FormData) {
  return run('content', async () => {
    if (!sectionSchemas[key]) throw new Error('Unknown section');
    const v = sectionSchemas[key](fd);
    for (const k of ['image_id', 'image_a', 'image_b']) if (k in (v || {})) v[k] = v[k] ? uuid.parse(v[k]) : null;
    await setContent(key, v);
    return { ok: true, message: 'Saved — the live website has been updated.' };
  });
}
export async function savePage(page: string, _: Res | null, fd: FormData) {
  return run('pages', async () => {
    if (!(page in DEFAULTS.pages)) throw new Error('Unknown page');
    const d = z.object({ title: req('Title', 100), body: str(20000) }).parse(Object.fromEntries(fd));
    const pages = await getContent('pages'); pages[page] = d; await setContent('pages', pages);
    return { ok: true, message: `“${d.title}” page saved.` };
  });
}
export async function saveFaqs(_: Res | null, fd: FormData) { return run('pages', async () => { await setContent('faqs', sectionSchemas.faqs(fd)); return { ok: true, message: 'FAQs saved.' }; }); }
export async function saveStoreInfo(_: Res | null, fd: FormData) {
  return run('pages', async () => {
    const url = z.string().trim().max(300).refine(v => v === '' || /^https:\/\//.test(v), 'Use a full https:// link');
    const d = z.object({ name: req('Store name', 60), tagline: str(60), email: z.string().trim().email('Enter a valid email'), phone: str(40), address: str(300), hours: str(120),
      instagram: url, facebook: url, tiktok: url, instagram_handle: str(60) }).parse(Object.fromEntries(fd));
    await setContent('store', { ...(await getContent('store')), ...d });
    return { ok: true, message: 'Store details saved.' };
  });
}
export async function saveSettings(_: Res | null, fd: FormData) {
  return run('settings', async () => {
    const d = z.object({ currency: req('Currency symbol', 4), free_shipping_threshold: money('Free delivery threshold'), standard_rate: money('Standard rate'), express_rate: money('Express rate'), nextday_rate: money('Next-day rate'),
      low_stock_threshold: z.coerce.number().int().min(0).max(1000), stock_deduct_on: z.enum(['placed', 'confirmed', 'paid']), bank_details: str(600) }).parse(Object.fromEntries(fd));
    const pay = { payment_cod: bool(fd, 'payment_cod'), payment_bank: bool(fd, 'payment_bank') };
    if (!pay.payment_cod && !pay.payment_bank) return { ok: false, message: 'Keep at least one payment method switched on.' };
    await setContent('store', { ...(await getContent('store')), ...d, ...pay });
    return { ok: true, message: 'Settings saved.' };
  });
}

// =============== promotions ===============
const dt = z.preprocess(v => (v ? new Date(String(v)) : null), z.date().nullable());
const codeSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'Use 3–30 letters, numbers, - or _'), description: str(200), kind: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive('Enter a value above 0'), min_order: z.coerce.number().min(0).default(0), starts_at: dt, expires_at: dt,
  usage_limit: z.preprocess(v => (v === '' || v == null ? null : v), z.coerce.number().int().positive().nullable()) });
async function saveCode(fd: FormData, id?: string): Promise<Res> {
  const d = codeSchema.parse(Object.fromEntries(fd));
  if (d.kind === 'percent' && d.value >= 100) return { ok: false, message: 'A percentage discount must be below 100%.', errors: { value: 'Below 100' } };
  if (d.starts_at && d.expires_at && d.expires_at <= d.starts_at) return { ok: false, message: 'The expiry date must be after the start date.', errors: { expires_at: 'After start date' } };
  const row = { ...d, active: bool(fd, 'active') };
  if (id) await sql`update discount_codes set ${sql(row)} where id = ${id}`; else await sql`insert into discount_codes ${sql(row)}`;
  return { ok: true, message: `Code ${d.code} saved.`, redirect: '/admin/promotions' };
}
export async function createCode(_: Res | null, fd: FormData) { return run('promotions', () => saveCode(fd)); }
export async function updateCode(id: string, _: Res | null, fd: FormData) { return run('promotions', () => saveCode(fd, uuid.parse(id))); }
export async function deleteCode(id: string) { return run('promotions', async () => { await sql`delete from discount_codes where id = ${uuid.parse(id)}`; return { ok: true, message: 'Code deleted.' }; }); }
export async function toggleCode(id: string) { return run('promotions', async () => { const [r] = await sql`update discount_codes set active = not active where id = ${uuid.parse(id)} returning code, active`; return { ok: true, message: `${r.code} ${r.active ? 'activated' : 'paused'}.` }; }); }

const campSchema = z.object({ name: req('Name', 100), description: str(300), percent_off: z.coerce.number().gt(0, 'Enter a percentage').lt(100, 'Must be below 100'), category_id: z.string().optional(),
  announcement: str(160), starts_at: z.coerce.date({ error: 'Choose a start date' }), ends_at: z.coerce.date({ error: 'Choose an end date' }) });
async function saveCampaign(fd: FormData, id?: string): Promise<Res> {
  const d = campSchema.parse(Object.fromEntries(fd));
  if (d.ends_at <= d.starts_at) return { ok: false, message: 'The end date must be after the start date.', errors: { ends_at: 'After start' } };
  const row = { ...d, category_id: d.category_id ? uuid.parse(d.category_id) : null, active: bool(fd, 'active') };
  if (id) await sql`update campaigns set ${sql(row)} where id = ${id}`; else await sql`insert into campaigns ${sql(row)}`;
  return { ok: true, message: `Campaign “${d.name}” saved.`, redirect: '/admin/promotions' };
}
export async function createCampaign(_: Res | null, fd: FormData) { return run('promotions', () => saveCampaign(fd)); }
export async function updateCampaign(id: string, _: Res | null, fd: FormData) { return run('promotions', () => saveCampaign(fd, uuid.parse(id))); }
export async function deleteCampaign(id: string) { return run('promotions', async () => { await sql`delete from campaigns where id = ${uuid.parse(id)}`; return { ok: true, message: 'Campaign deleted.' }; }); }
export async function setSalePrice(id: string, _: Res | null, fd: FormData) {
  return run('promotions', async () => {
    const sale = optMoney.parse(fd.get('sale_price'));
    const [p] = await sql`select name, price from products where id = ${uuid.parse(id)}`;
    if (sale != null && sale >= Number(p.price)) return { ok: false, message: `Sale price must be below ${p.price}.` };
    await sql`update products set sale_price = ${sale}, updated_at = now() where id = ${id}`;
    return { ok: true, message: sale == null ? `${p.name} removed from sale.` : `${p.name} now on sale.` };
  });
}

// =============== messages ===============
export async function toggleMessage(id: string) { return run('messages', async () => { await sql`update contact_messages set handled = not handled where id = ${uuid.parse(id)}`; return { ok: true, message: 'Message updated.' }; }); }
export async function deleteSubscriber(id: string) { return run('messages', async () => { await sql`delete from newsletter_subscribers where id = ${uuid.parse(id)}`; return { ok: true, message: 'Subscriber removed.' }; }); }

// =============== admin users (owner only) ===============
export async function createUser(_: Res | null, fd: FormData) {
  return run('users', async () => {
    const d = z.object({ name: req('Name', 80), email: z.string().trim().toLowerCase().email('Enter a valid email'), role: z.enum(['owner', 'manager', 'staff']), password: z.string().min(10, 'Use at least 10 characters').max(200) }).parse(Object.fromEntries(fd));
    await sql`insert into admin_users (name, email, role, password_hash) values (${d.name}, ${d.email}, ${d.role}, ${await hashPassword(d.password)})`;
    return { ok: true, message: `${d.name} can now sign in as ${d.role}.` };
  });
}
export async function updateUser(id: string, _: Res | null, fd: FormData) {
  return run('users', async a => {
    const d = z.object({ role: z.enum(['owner', 'manager', 'staff']), password: z.string().max(200).optional() }).parse(Object.fromEntries(fd));
    const active = bool(fd, 'active');
    if (id === a.id && (d.role !== 'owner' || !active)) return { ok: false, message: 'You can’t remove your own owner access.' };
    if (d.password && d.password.length < 10) return { ok: false, message: 'New passwords need at least 10 characters.', errors: { password: 'At least 10 characters' } };
    const hash = d.password ? await hashPassword(d.password) : null;
    await sql.begin(async (tx: any) => {
      await tx`update admin_users set role = ${d.role}, active = ${active}, session_version = session_version + 1 ${hash ? tx`, password_hash = ${hash}` : tx``} where id = ${uuid.parse(id)}`;
      const [{ n }] = await tx`select count(*)::int as n from admin_users where role = 'owner' and active`;
      if (n === 0) throw new Error('There must always be at least one active owner.');
    });
    return { ok: true, message: 'User updated. They will need to sign in again.' };
  });
}

export async function whoami() { return getAdmin(); }
