// Loads sample data so the shop and the CMS can be demonstrated straight away.
// Run once on an empty database:  npm run db:seed   (use --force to wipe catalogue/orders and reseed)
import 'dotenv/config';
import postgres from 'postgres';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { shoeSVG } from './shoe-svg.mjs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
const force = process.argv.includes('--force');

const [{ n }] = await sql`select count(*)::int as n from products`;
if (n > 0 && !force) { console.log('Products already exist — skipping seed (use --force to reseed).'); await ensureAdmin(); await sql.end(); process.exit(0); }
if (force) await sql`truncate order_events, order_items, orders, customers, product_variants, product_colors, product_images, product_categories, products, categories, discount_codes, campaigns, site_content, newsletter_subscribers, contact_messages, images restart identity cascade`;

async function storeImage(buf, alt = '') {
  const img = sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 });
  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  const [r] = await sql`insert into images (mime, width, height, bytes, data, alt) values ('image/webp', ${info.width}, ${info.height}, ${data.length}, ${data}, ${alt}) returning id`;
  return r.id;
}
const photo = {};
for (const k of ['hero', 'banner', 'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'p1', 'p2', 'p3', 'p4', 'p5', 'i1', 'i2', 'i3', 'i4', 'i5', 'i6'])
  photo[k] = await storeImage(readFileSync(new URL(`../db/seed/images/${k}.jpg`, import.meta.url)), k);
const C = { black: '#1E1A18', nude: '#D9B99B', burgundy: '#6E1C24', gold: '#C9A45C', champagne: '#E6D3B0', white: '#F5F0E8', silver: '#C9C6C0', ivory: '#F3EBDD', blush: '#E7C6BE', chocolate: '#5B3A29', taupe: '#A08F80', cream: '#EFE6D6', sage: '#A9B19A' };
async function illus(type, color, view = '') {
  const svg = shoeSVG(type, C[color], view).replace('<svg ', '<svg width="1000" height="1000" ');
  return storeImage(await sharp(Buffer.from(svg)).png().toBuffer(), `${type} ${color}`);
}
console.log('✓ Images');

// ---------- categories ----------
const cats = [
  ['Heels', 'heels', 'Stilettos, pumps and sculpted heels for every occasion.', photo.i5, true, true],
  ['Flats', 'flats', 'Ballerinas and loafers with effortless, everyday elegance.', await illus('ballet', 'blush'), true, true],
  ['Sandals', 'sandals', 'Strappy, embellished and sculpted sandals.', photo.cat5, true, true],
  ['Sneakers', 'sneakers', 'Luxury sneakers in the finest leathers.', await illus('sneaker', 'white'), true, true],
  ['Wedding & Occasion', 'wedding-occasion', 'Crystal, satin and metallic finishes for the moments that matter.', photo.i4, false, true],
  ['Office Wear', 'office-wear', 'Polished pumps, block heels and loafers for the working week.', photo.i2, false, true]
];
const catId = {};
for (const [i, [name, slug, description, image_id, nav, home]] of cats.entries()) {
  const [r] = await sql`insert into categories (name, slug, description, image_id, sort_order, show_in_nav, show_on_home) values (${name}, ${slug}, ${description}, ${image_id}, ${i}, ${nav}, ${home}) returning id`;
  catId[slug] = r.id;
}
console.log('✓ Categories');

// ---------- products ----------
const P = [
  ['Luxe Pointed Pump', ['heels', 'office-wear', 'wedding-occasion'], 18900, null, ['black', 'nude', 'burgundy'], 'best', ['p1', 'i3', 'i1'], '95mm stiletto', 'Italian calf leather', 'Our signature pump, refined to perfection. A sharply pointed toe and a slender 95mm heel lengthen the leg, while a cushioned leather footbed keeps you poised from boardroom to dinner.'],
  ['Classic Ankle Strap', ['heels', 'wedding-occasion'], 16500, null, ['nude', 'black', 'white'], 'new', ['p2', 'i6', 'cat1'], '100mm stiletto', 'Nappa leather', 'A barely-there silhouette with a delicate ankle strap and gold-tone buckle. Effortlessly elegant with everything from a slip dress to tailored trousers.'],
  ['Embellished Bow Pump', ['heels', 'wedding-occasion'], 24500, null, ['black', 'nude'], 'new best featured', ['p3', 'i1'], '95mm stiletto', 'Satin with crystal bow', 'Hand-set crystals form a sculptural bow on lustrous satin. A modern heirloom designed for weddings, galas and the moments worth remembering.'],
  ['Golden Hour Sandal', ['sandals', 'wedding-occasion'], 21500, null, ['gold', 'champagne', 'silver'], 'new featured', ['p4', 'banner'], '90mm stiletto', 'Metallic laminated leather', 'Fine metallic straps that catch the light at every step. A sunset-ready sandal that pairs beautifully with flowing silhouettes.'],
  ['Velvet Slingback', ['heels', 'wedding-occasion'], 21900, 17500, ['burgundy', 'black', 'nude'], '', ['p5'], '85mm sculpted', 'Italian velvet', 'Rich velvet, a pointed toe and an adjustable slingback strap. The perfect evening heel, now with a little something off.'],
  ['Nude Stiletto Pump', ['heels', 'office-wear'], 17900, null, ['nude', 'black', 'blush'], 'best', ['cat2', 'i2'], '100mm stiletto', 'Patent calf leather', 'The essential nude pump in a softly glossed patent. Tonal to the skin to lengthen the leg — the pair every wardrobe returns to.'],
  ['Sloane Block Heel', ['heels', 'office-wear'], 15900, null, ['black', 'nude', 'chocolate'], 'new', ['cat3'], '70mm block', 'Suede & calf leather', 'All-day elegance on a stable 70mm block heel. A pointed toe and slim ankle strap keep the line sleek through a busy day.'],
  ['Sculpted Mule', ['sandals', 'office-wear'], 17500, 13900, ['nude', 'black', 'white'], '', ['cat4'], '75mm sculpted', 'Soft nappa leather', 'A wide, softly padded strap on a sculpted heel. Slip-on ease with a polished finish — from city lunches to summer evenings.'],
  ['Crystal Strap Sandal', ['sandals', 'wedding-occasion'], 22900, null, ['silver', 'champagne'], 'best featured', ['cat5', 'i4'], '95mm stiletto', 'Crystal-embellished mesh', 'Rows of crystals on whisper-fine straps create a luminous, almost weightless effect. A bridal favourite and an evening statement.'],
  ['Midnight Barely-There', ['heels', 'wedding-occasion'], 16900, null, ['black', 'nude'], 'best', ['i5', 'hero', 'cat1'], '100mm stiletto', 'Suede', 'A whisper of a sandal in velvet-soft suede. The fine ankle strap and slender heel make it the definitive little black sandal.'],
  ['Aurum Metallic Pump', ['heels', 'wedding-occasion'], 19900, null, ['gold', 'silver'], 'new featured', ['banner'], '100mm stiletto', 'Mirror metallic leather', 'Liquid gold, sculpted into a timeless pump. A head-turning finish for celebrations, with a cushioned insole for long nights.'],
  ['Rivière Ballet Flat', ['flats', 'office-wear'], 11900, null, ['ivory', 'black', 'blush'], 'new', 'ballet', '5mm flat', 'Lambskin leather', 'Glove-soft lambskin with a petite bow. Fully lined and flexible, it folds into your bag and carries you everywhere.'],
  ['Mayfair Leather Loafer', ['flats', 'office-wear'], 14900, null, ['chocolate', 'black', 'cream'], 'best', 'loafer', '20mm stacked', 'Polished calf leather', 'A modern classic finished with our champagne-gold horsebit. Polished calf leather and a low stacked heel for effortless office elegance.'],
  ['Pointe Ballerina', ['flats'], 13900, 10900, ['nude', 'black', 'burgundy'], '', 'ballet', '5mm flat', 'Nappa leather', 'A refined everyday flat with a softly pointed toe. Lightweight, cushioned and endlessly versatile.'],
  ['Étoile Court Sneaker', ['sneakers'], 15900, null, ['white', 'blush', 'sage'], 'new', 'sneaker', '30mm sole', 'Smooth calf leather', 'A clean court silhouette in smooth leather with a champagne-gold heel tab. Hand-finished sole and a memory-foam insole for city miles.'],
  ['Luxe Platform Sneaker', ['sneakers'], 17900, null, ['cream', 'black', 'taupe'], 'best', 'sneaker', '40mm platform', 'Suede & calf leather', 'Elevated comfort on a lightweight platform. Tonal suede panels and gold detailing make it the most elegant sneaker you’ll own.']
];
const slug = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
let seedN = 7; const rnd = () => (seedN = (seedN * 9301 + 49297) % 233280) / 233280;
const variantIds = [];
for (const [i, [name, catsOf, price, sale, colors, flags, imgs, heel, material, description]] of P.entries()) {
  const [p] = await sql`insert into products (name, slug, description, details, price, sale_price, heel, material, is_new, is_bestseller, is_featured, sort_order, created_at)
    values (${name}, ${slug(name)}, ${description}, ${`Upper: ${material}\nLining: soft leather\nHeel: ${heel}\nCushioned leather footbed with anti-slip sole\nHandcrafted in Italy`},
            ${price}, ${sale}, ${heel}, ${material}, ${flags.includes('new')}, ${flags.includes('best')}, ${flags.includes('featured')}, ${i}, now() - ${`${(P.length - i) * 3} days`}::interval)
    returning id`;
  for (const c of catsOf) await sql`insert into product_categories values (${p.id}, ${catId[c]})`;
  const imageIds = Array.isArray(imgs) ? imgs.map(k => photo[k]) : [await illus(imgs, colors[0]), await illus(imgs, colors[0], 'mirror'), await illus(imgs, colors[1])];
  for (const [j, id] of imageIds.entries()) await sql`insert into product_images values (${p.id}, ${id}, ${j})`;
  for (const [j, c] of colors.entries()) await sql`insert into product_colors (product_id, name, hex, sort_order) values (${p.id}, ${c[0].toUpperCase() + c.slice(1)}, ${C[c]}, ${j})`;
  for (const c of colors) for (let s = 35; s <= 42; s++) {
    const r = rnd(); const stock = r < 0.03 ? 0 : r < 0.08 ? 1 + Math.floor(rnd() * 2) : 4 + Math.floor(rnd() * 12);
    const [v] = await sql`insert into product_variants (product_id, color, size, stock, sku) values (${p.id}, ${c[0].toUpperCase() + c.slice(1)}, ${s}, ${stock}, ${`FN-${String(i + 1).padStart(3, '0')}-${c.slice(0, 3).toUpperCase()}-${s}`}) returning id`;
    variantIds.push({ id: v.id, product_id: p.id, name, color: c[0].toUpperCase() + c.slice(1), size: s, price: sale ?? price, image: imageIds[0] });
  }
}
console.log('✓ Products, colours, sizes & stock');

// ---------- promotions ----------
await sql`insert into discount_codes (code, description, kind, value, min_order) values ('WELCOME10', 'Newsletter welcome offer', 'percent', 10, 0)`;
await sql`insert into discount_codes (code, description, kind, value, min_order, expires_at, usage_limit) values ('VIP2500', 'VIP clients — Rs. 2,500 off orders over Rs. 15,000', 'fixed', 2500, 15000, now() + interval '60 days', 200)`;
await sql`insert into discount_codes (code, description, kind, value, min_order, expires_at, active) values ('SUMMER15', 'Summer campaign (expired)', 'percent', 15, 0, now() - interval '30 days', true)`;
await sql`insert into campaigns (name, description, percent_off, category_id, announcement, starts_at, ends_at, active)
          values ('Sandal Week', '10% off every sandal', 10, ${catId.sandals}, 'Sandal Week — 10% off all sandals', now() - interval '1 day', now() + interval '14 days', true)`;
console.log('✓ Discount codes & campaign');

// ---------- customers & orders ----------
const people = [
  ['Amelia Hart', 'amelia.hart@example.com', '07700 900111', '14 Rose Lane', 'London', 'SW3 4HT'],
  ['Sofia Bennett', 'sofia.b@example.com', '07700 900222', '8 Kings Road', 'London', 'SW10 0EX'],
  ['Isabelle Clarke', 'isabelle.clarke@example.com', '07700 900333', '22 Park Crescent', 'Manchester', 'M14 5RL'],
  ['Charlotte Evans', 'charlotte.e@example.com', '07700 900444', '3 Abbey Mews', 'Bath', 'BA1 1LT'],
  ['Olivia Grant', 'olivia.grant@example.com', '07700 900555', '61 Queen Street', 'Edinburgh', 'EH2 1JX'],
  ['Mia Thompson', 'mia.t@example.com', '07700 900666', '9 Mill Road', 'Cambridge', 'CB1 2AD'],
  ['Grace Wilson', 'grace.wilson@example.com', '07700 900777', '17 Harbour View', 'Bristol', 'BS1 5DB'],
  ['Emily Shah', 'emily.shah@example.com', '07700 900888', '40 Elm Grove', 'Leeds', 'LS6 2AF']
];
const custPw = await bcrypt.hash('Customer!2026', 12);
const cust = [];
for (const [i, [name, email, phone, a1, city, pc]] of people.entries()) {
  const [c] = await sql`insert into customers (email, name, phone, address_line1, city, postcode, country, password_hash, created_at)
    values (${email}, ${name}, ${phone}, ${a1}, ${city}, ${pc}, 'United Kingdom', ${i < 3 ? custPw : null}, now() - ${`${200 - i * 15} days`}::interval) returning *`;
  cust.push(c);
}
const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing', 'confirmed', 'pending', 'cancelled'];
for (let k = 0; k < 34; k++) {
  const c = cust[Math.floor(rnd() * cust.length)];
  const daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 270);
  const status = daysAgo > 20 ? (rnd() < 0.08 ? 'cancelled' : 'delivered') : statuses[Math.floor(rnd() * statuses.length)];
  const lines = []; const nLines = 1 + Math.floor(rnd() * 2);
  for (let j = 0; j < nLines; j++) lines.push({ ...variantIds[Math.floor(rnd() * variantIds.length)], qty: 1 + (rnd() < 0.15 ? 1 : 0) });
  const subtotal = lines.reduce((a, l) => a + Number(l.price) * l.qty, 0);
  const shipping = subtotal >= 15000 ? 0 : 450;
  const pay = rnd() < 0.6 ? 'cod' : 'bank_transfer';
  const paid = ['delivered', 'shipped'].includes(status) || (status === 'processing' && pay === 'bank_transfer');
  const [o] = await sql`insert into orders (customer_id, email, name, phone, address_line1, city, postcode, country, shipping_method, subtotal, discount, shipping, total, status, payment_method, payment_status, stock_deducted, created_at, updated_at)
    values (${c.id}, ${c.email}, ${c.name}, ${c.phone}, ${c.address_line1}, ${c.city}, ${c.postcode}, 'United Kingdom', 'Standard Delivery', ${subtotal}, 0, ${shipping}, ${subtotal + shipping},
            ${status}, ${pay}, ${paid ? 'paid' : 'unpaid'}, ${!['pending', 'cancelled'].includes(status)}, now() - ${`${daysAgo} days`}::interval, now() - ${`${daysAgo} days`}::interval) returning id`;
  for (const l of lines) await sql`insert into order_items (order_id, product_id, variant_id, name, color, size, qty, unit_price, image_id) values (${o.id}, ${l.product_id}, ${l.id}, ${l.name}, ${l.color}, ${l.size}, ${l.qty}, ${l.price}, ${l.image})`;
  await sql`insert into order_events (order_id, kind, message, created_at) values (${o.id}, 'status', 'Order placed', now() - ${`${daysAgo} days`}::interval)`;
  if (status !== 'pending') await sql`insert into order_events (order_id, kind, message, actor, created_at) values (${o.id}, 'status', ${`Status changed to ${status}`}, 'Owner', now() - ${`${Math.max(0, daysAgo - 1)} days`}::interval)`;
}
console.log('✓ Customers & orders');

// ---------- content ----------
const setC = (key, value) => sql`insert into site_content (key, value) values (${key}, ${sql.json(value)}) on conflict (key) do update set value = excluded.value`;
await setC('hero', { image_id: photo.hero });
await setC('editorial', { image_id: photo.i1 });
await setC('story', { image_a: photo.i6, image_b: photo.p3 });
await setC('promo', { image_id: photo.banner });
await setC('instagram', { image_ids: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'].map(k => photo[k]) });
await sql`insert into newsletter_subscribers (email) values ('amelia.hart@example.com'), ('olivia.grant@example.com'), ('new.client@example.com') on conflict do nothing`;
await sql`insert into contact_messages (name, email, topic, message) values ('Sofia Bennett', 'sofia.b@example.com', 'Sizing & fit', 'Hello! I am usually a UK 5 — would you recommend EU 38 for the Luxe Pointed Pump?')`;
console.log('✓ Website content');

await ensureAdmin();
await sql.end();
console.log('\nAll done. Start the site with `npm run dev` and sign in at /admin/login');

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase(), pw = process.env.ADMIN_PASSWORD;
  if (!email || !pw) { console.log('! Set ADMIN_EMAIL and ADMIN_PASSWORD to create the owner account'); return; }
  const [ex] = await sql`select id from admin_users where email = ${email}`;
  if (ex) return;
  await sql`insert into admin_users (email, name, password_hash, role) values (${email}, 'Shop Owner', ${await bcrypt.hash(pw, 12)}, 'owner')`;
  console.log(`✓ Owner account ${email} created — change the password after first sign-in`);
}
