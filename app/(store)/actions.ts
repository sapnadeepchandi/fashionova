'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { checkDiscount, placeOrder, priceCart, shippingOptions } from '@/lib/orders';
import { checkPassword, clientIp, endCustomerSession, getCustomer, hashPassword, isThrottled, recordAttempt, startCustomerSession } from '@/lib/auth';
import { getContent } from '@/lib/content';

export type Res = { ok: boolean; message?: string; errors?: Record<string, string>; data?: any };
const email = z.string().trim().toLowerCase().email('Please enter a valid email address').max(200);
const fieldErrors = (e: z.ZodError) => Object.fromEntries(e.issues.map(i => [String(i.path[0]), i.message]));

export async function subscribe(_: Res | null, fd: FormData): Promise<Res> {
  const p = email.safeParse(fd.get('email'));
  if (!p.success) return { ok: false, message: 'Please enter a valid email address.' };
  await sql`insert into newsletter_subscribers (email) values (${p.data}) on conflict (email) do nothing`;
  return { ok: true, message: 'Welcome to Fashionova — use code WELCOME10 for 10% off your first order.' };
}

const contactSchema = z.object({ name: z.string().trim().min(2, 'Please enter your name').max(120), email, topic: z.string().max(80).default(''), message: z.string().trim().min(10, 'Please write a little more').max(4000) });
export async function sendContact(_: Res | null, fd: FormData): Promise<Res> {
  const p = contactSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(p.error) };
  await sql`insert into contact_messages (name, email, topic, message) values (${p.data.name}, ${p.data.email}, ${p.data.topic}, ${p.data.message})`;
  return { ok: true, message: 'Thank you — our client care team will reply within one working day.' };
}

const lineSchema = z.array(z.object({ variant_id: z.string().uuid(), qty: z.coerce.number().int().min(1).max(10) })).max(50);

/** Checkout summary: live prices, stock problems, shipping options and discount */
export async function quote(lines: unknown, code?: string) {
  const l = lineSchema.safeParse(lines);
  if (!l.success) return { items: [], subtotal: 0, problems: ['Your bag could not be read.'], shipping: [], discount: { ok: true, amount: 0 } };
  const cart = await priceCart(l.data);
  const [shipping, discount, store] = await Promise.all([shippingOptions(cart.subtotal), checkDiscount(code, cart.subtotal), getContent('store')]);
  return {
    items: cart.items.map(i => ({ variant_id: i.variant_id, slug: i.slug, name: i.name, color: i.color, size: i.size, qty: i.qty, stock: i.stock, unit_price: i.unit_price, image_id: i.image_id })),
    subtotal: cart.subtotal, problems: cart.problems, shipping, discount,
    payments: { cod: !!store.payment_cod, bank: !!store.payment_bank, bank_details: store.bank_details }
  };
}

const orderSchema = z.object({
  email, name: z.string().trim().min(2, 'Please enter your full name').max(120), phone: z.string().trim().min(6, 'Please enter a phone number').max(40),
  address_line1: z.string().trim().min(3, 'Please enter your address').max(200), address_line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2, 'Please enter your city').max(100), postcode: z.string().trim().min(2, 'Please enter your postcode').max(20),
  country: z.string().trim().min(2).max(80), notes: z.string().trim().max(1000).optional().default(''),
  shipping_method: z.enum(['standard', 'express', 'nextday']), payment_method: z.enum(['cod', 'bank_transfer']),
  discount_code: z.string().trim().max(40).optional().default(''), marketing: z.string().optional(), lines: z.string()
});
export async function submitOrder(_: Res | null, fd: FormData): Promise<Res> {
  const p = orderSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: 'Please complete the highlighted fields.', errors: fieldErrors(p.error) };
  let lines; try { lines = lineSchema.parse(JSON.parse(p.data.lines)); } catch { return { ok: false, message: 'Your bag could not be read. Please refresh and try again.' }; }
  const store = await getContent('store');
  if ((p.data.payment_method === 'cod' && !store.payment_cod) || (p.data.payment_method === 'bank_transfer' && !store.payment_bank)) return { ok: false, message: 'That payment method is not available.' };
  const customer = await getCustomer();
  let o;
  try {
    o = await placeOrder({ ...p.data, lines, discount_code: p.data.discount_code || undefined, customer_id: customer?.id, marketing: !!p.data.marketing });
  } catch (e: any) { return { ok: false, message: e.message || 'Your order could not be placed.' }; }
  if (p.data.marketing) await sql`insert into newsletter_subscribers (email) values (${p.data.email}) on conflict do nothing`;
  return { ok: true, data: { token: o.access_token, number: o.number } };
}

// ---------- customer accounts ----------
const regSchema = z.object({ name: z.string().trim().min(2, 'Please enter your name').max(120), email, password: z.string().min(8, 'Use at least 8 characters').max(200) });
export async function register(_: Res | null, fd: FormData): Promise<Res> {
  const p = regSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(p.error) };
  const [ex] = await sql`select id, password_hash from customers where email = ${p.data.email}`;
  if (ex?.password_hash) return { ok: false, message: 'An account with this email already exists — please sign in.' };
  const hash = await hashPassword(p.data.password);
  const [c] = ex
    ? await sql`update customers set password_hash = ${hash}, name = ${p.data.name} where id = ${ex.id} returning id, session_version`
    : await sql`insert into customers (email, name, password_hash) values (${p.data.email}, ${p.data.name}, ${hash}) returning id, session_version`;
  await startCustomerSession(c as any);
  redirect('/account');
}
export async function login(_: Res | null, fd: FormData): Promise<Res> {
  const e = email.safeParse(fd.get('email')); const pw = String(fd.get('password') || '');
  if (!e.success || !pw) return { ok: false, message: 'Please enter your email and password.' };
  const ip = await clientIp();
  if (await isThrottled('customer', e.data, ip)) return { ok: false, message: 'Too many attempts. Please wait 15 minutes and try again.' };
  const [c] = await sql`select id, password_hash, session_version from customers where email = ${e.data}`;
  const ok = !!c?.password_hash && await checkPassword(pw, c.password_hash);
  await recordAttempt('customer', e.data, ip, ok);
  if (!ok) return { ok: false, message: 'Email or password is incorrect.' };
  await startCustomerSession(c as any);
  redirect('/account');
}
export async function logout() { await endCustomerSession(); redirect('/account'); }

const profileSchema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(40), address_line1: z.string().trim().max(200), address_line2: z.string().trim().max(200), city: z.string().trim().max(100), postcode: z.string().trim().max(20), country: z.string().trim().max(80) });
export async function saveProfile(_: Res | null, fd: FormData): Promise<Res> {
  const c = await getCustomer(); if (!c) return { ok: false, message: 'Please sign in again.' };
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: 'Please check your details.', errors: fieldErrors(p.error) };
  await sql`update customers set ${sql(p.data)} where id = ${c.id}`;
  return { ok: true, message: 'Your details have been saved.' };
}
