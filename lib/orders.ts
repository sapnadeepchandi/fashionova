import 'server-only';
import { sql } from './db';
import { getContent } from './content';
import { activeCampaigns, applyPricing } from './catalog';
import { money } from './format';

export type CartLine = { variant_id: string; qty: number };
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function shippingOptions(subtotal: number, db: any = sql) {
  const s = await getContent('store', db);
  return [
    { id: 'standard', label: 'Standard Delivery', note: '3–5 working days', price: subtotal >= Number(s.free_shipping_threshold) ? 0 : Number(s.standard_rate) },
    { id: 'express', label: 'Express Delivery', note: '1–2 working days', price: Number(s.express_rate) },
    { id: 'nextday', label: 'Next-Day Premium', note: 'Order before 2pm, signed for', price: Number(s.nextday_rate) }
  ];
}

export async function checkDiscount(code: string | null | undefined, subtotal: number, db: any = sql) {
 const cur = (await getContent('store', db)).currency;
  if (!code) return { ok: true, amount: 0, code: null as string | null };
  const [d] = await db`select * from discount_codes where upper(code) = upper(${code.trim()})`;
  const now = new Date();
  if (!d || !d.active) return { ok: false, amount: 0, code: null, message: 'That code isn’t valid.' };
  if (d.starts_at && new Date(d.starts_at) > now) return { ok: false, amount: 0, code: null, message: 'That code isn’t active yet.' };
  if (d.expires_at && new Date(d.expires_at) < now) return { ok: false, amount: 0, code: null, message: 'That code has expired.' };
  if (d.usage_limit != null && d.used_count >= d.usage_limit) return { ok: false, amount: 0, code: null, message: 'That code has reached its usage limit.' };
  if (subtotal < Number(d.min_order)) return { ok: false, amount: 0, code: null, message: `This code needs a minimum order of ${money(Number(d.min_order), cur)}.` };
  const amount = d.kind === 'percent' ? r2(subtotal * Number(d.value) / 100) : Math.min(subtotal, Number(d.value));
  return { ok: true, amount, code: d.code as string, id: d.id, label: d.kind === 'percent' ? `${Number(d.value)}% off` : `${money(Number(d.value), cur)} off` };
}

/** Load cart lines with live prices + stock. Used for the bag, checkout and order placement. */
export async function priceCart(lines: CartLine[], db: any = sql) {
  const ids = [...new Set(lines.map(l => l.variant_id))].filter(x => /^[0-9a-f-]{36}$/i.test(x));
  if (!ids.length) return { items: [], subtotal: 0, problems: [] as string[] };
  const rows = await db`
    select v.id as variant_id, v.color, v.size, v.stock, p.id as product_id, p.name, p.slug, p.price, p.sale_price, p.active,
      (select pi.image_id from product_images pi where pi.product_id = p.id order by pi.sort_order limit 1) as image_id,
      coalesce((select json_agg(json_build_object('id', pc.category_id)) from product_categories pc where pc.product_id = p.id), '[]') as categories
    from product_variants v join products p on p.id = v.product_id where v.id = any(${ids}::uuid[])`;
 const camps = await activeCampaigns(db);
  const problems: string[] = [];
  const items = [];
  for (const l of lines) {
    const r = rows.find((x: any) => x.variant_id === l.variant_id);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(l.qty) || 1)));
    if (!r || !r.active) { problems.push('An item in your bag is no longer available and was removed.'); continue; }
    const priced = applyPricing({ ...r, categories: r.categories }, camps);
    if (r.stock < qty) problems.push(r.stock === 0 ? `${r.name} (${r.color}, EU ${r.size}) is sold out.` : `Only ${r.stock} left of ${r.name} (${r.color}, EU ${r.size}).`);
    items.push({ ...r, qty, unit_price: priced.effective, was: priced.was, line_total: r2(priced.effective * qty) });
  }
  return { items, subtotal: r2(items.reduce((a, i) => a + i.line_total, 0)), problems };
}

async function deductStock(tx: any, orderId: string, actor: string) {
  const items = await tx`select variant_id, qty, name, color, size from order_items where order_id = ${orderId}`;
  for (const it of items) {
    if (!it.variant_id) continue;
    const res = await tx`update product_variants set stock = stock - ${it.qty} where id = ${it.variant_id} and stock >= ${it.qty} returning stock`;
    if (!res.length) throw new Error(`Not enough stock for ${it.name} (${it.color}, EU ${it.size}).`);
  }
  await tx`update orders set stock_deducted = true where id = ${orderId}`;
  await tx`insert into order_events (order_id, kind, message, actor) values (${orderId}, 'stock', 'Stock reduced for all items', ${actor})`;
}
async function restoreStock(tx: any, orderId: string, actor: string) {
  const items = await tx`select variant_id, qty from order_items where order_id = ${orderId}`;
  for (const it of items) if (it.variant_id) await tx`update product_variants set stock = stock + ${it.qty} where id = ${it.variant_id}`;
  await tx`update orders set stock_deducted = false where id = ${orderId}`;
  await tx`insert into order_events (order_id, kind, message, actor) values (${orderId}, 'stock', 'Stock returned to inventory', ${actor})`;
}

export type PlaceInput = {
  lines: CartLine[]; email: string; name: string; phone: string; address_line1: string; address_line2?: string; city: string; postcode: string; country: string;
  notes?: string; shipping_method: string; payment_method: 'cod' | 'bank_transfer'; discount_code?: string; customer_id?: string | null; marketing?: boolean;
};

export async function placeOrder(input: PlaceInput) {
  const store = await getContent('store');
  return sql.begin(async (tx: any) => {
    const cart = await priceCart(input.lines, tx);
    if (!cart.items.length) throw new Error('Your bag is empty.');
    if (cart.problems.length) throw new Error(cart.problems.join(' '));
   const ship = (await shippingOptions(cart.subtotal, tx)).find(s => s.id === input.shipping_method);
    if (!ship) throw new Error('Please choose a delivery method.');
    const disc = await checkDiscount(input.discount_code, cart.subtotal, tx);
    if (!disc.ok) throw new Error((disc as any).message);
    const total = r2(cart.subtotal - disc.amount + ship.price);

    // customer record (guest or signed in)
    let customerId = input.customer_id || null;
    if (!customerId) {
      const [c] = await tx`
        insert into customers (email, name, phone, address_line1, address_line2, city, postcode, country, marketing_opt_in)
        values (${input.email.toLowerCase()}, ${input.name}, ${input.phone}, ${input.address_line1}, ${input.address_line2 || ''}, ${input.city}, ${input.postcode}, ${input.country}, ${!!input.marketing})
        on conflict (email) do update set name = excluded.name, phone = excluded.phone, address_line1 = excluded.address_line1,
          address_line2 = excluded.address_line2, city = excluded.city, postcode = excluded.postcode, country = excluded.country
        returning id`;
      customerId = c.id;
    }
    const [o] = await tx`
      insert into orders (customer_id, email, name, phone, address_line1, address_line2, city, postcode, country, notes, shipping_method,
                          subtotal, discount, shipping, total, discount_code, payment_method)
      values (${customerId}, ${input.email.toLowerCase()}, ${input.name}, ${input.phone}, ${input.address_line1}, ${input.address_line2 || ''}, ${input.city},
              ${input.postcode}, ${input.country}, ${input.notes || ''}, ${ship.label}, ${cart.subtotal}, ${disc.amount}, ${ship.price}, ${total},
              ${disc.code}, ${input.payment_method})
      returning id, number, access_token`;
    for (const it of cart.items) {
      await tx`insert into order_items (order_id, product_id, variant_id, name, color, size, qty, unit_price, image_id)
               values (${o.id}, ${it.product_id}, ${it.variant_id}, ${it.name}, ${it.color}, ${it.size}, ${it.qty}, ${it.unit_price}, ${it.image_id})`;
    }
    if (disc.code) await tx`update discount_codes set used_count = used_count + 1 where id = ${(disc as any).id}`;
    await tx`insert into order_events (order_id, kind, message) values (${o.id}, 'status', 'Order placed')`;
    if (store.stock_deduct_on === 'placed') await deductStock(tx, o.id, 'system');
    return o;
  });
}

const ACTIVE_AFTER_CONFIRM = ['confirmed', 'processing', 'shipped', 'delivered'];

export async function updateOrderStatus(orderId: string, status: string, actor: string, note?: string) {
  const store = await getContent('store');
  return sql.begin(async (tx: any) => {
    const [o] = await tx`select * from orders where id = ${orderId} for update`;
    if (!o) throw new Error('Order not found.');
    if (o.status === status && !note) return o;
    if (o.status !== status) {
      await tx`update orders set status = ${status}, updated_at = now() where id = ${orderId}`;
      await tx`insert into order_events (order_id, kind, message, actor) values (${orderId}, 'status', ${`Status changed from ${o.status} to ${status}`}, ${actor})`;
      if (status === 'cancelled' && o.stock_deducted) await restoreStock(tx, orderId, actor);
      const shouldDeduct = !o.stock_deducted && status !== 'cancelled' && (
        store.stock_deduct_on === 'placed' ||
        (store.stock_deduct_on === 'confirmed' && ACTIVE_AFTER_CONFIRM.includes(status)) ||
        (store.stock_deduct_on === 'paid' && o.payment_status === 'paid'));
      if (shouldDeduct) await deductStock(tx, orderId, actor);
    }
    if (note) await tx`insert into order_events (order_id, kind, message, actor) values (${orderId}, 'note', ${note}, ${actor})`;
    return o;
  });
}

export async function updatePaymentStatus(orderId: string, payment: string, actor: string) {
  const store = await getContent('store');
  return sql.begin(async (tx: any) => {
    const [o] = await tx`select * from orders where id = ${orderId} for update`;
    if (!o) throw new Error('Order not found.');
    if (o.payment_status === payment) return;
    await tx`update orders set payment_status = ${payment}, updated_at = now() where id = ${orderId}`;
    await tx`insert into order_events (order_id, kind, message, actor) values (${orderId}, 'payment', ${`Payment marked as ${payment}`}, ${actor})`;
    if (payment === 'paid' && store.stock_deduct_on === 'paid' && !o.stock_deducted && o.status !== 'cancelled') await deductStock(tx, orderId, actor);
  });
}
