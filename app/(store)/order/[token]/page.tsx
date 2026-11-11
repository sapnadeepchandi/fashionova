import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { cap, fmtDate, imgUrl, money } from '@/lib/format';

export const metadata = { title: 'Your order', robots: { index: false } };
const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) notFound();
  const [o] = await sql`select * from orders where access_token = ${token}`;
  if (!o) notFound();
  const items = await sql`select * from order_items where order_id = ${o.id}`;
  const store = await getContent('store');
  const cur = store.currency;
  const step = STEPS.indexOf(o.status);
  return (
    <div className="wrap" style={{ maxWidth: 860, padding: '70px 20px' }}>
      <div className="center">
        <div className="done" style={{ padding: 0 }}><div className="tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div></div>
        <span className="eyebrow">Order {o.number} · {fmtDate(o.created_at)}</span>
        <h1 style={{ fontSize: 'clamp(36px,4.4vw,54px)', fontWeight: 400, margin: '10px 0 12px' }}>Thank you, {o.name.split(' ')[0]}.</h1>
        <p style={{ color: 'var(--muted)' }}>Your order has been received. Keep this page’s link to check its progress at any time.</p>
      </div>
      {o.status === 'cancelled' ? <div className="err-box" style={{ marginTop: 30 }}>This order has been cancelled. Please contact us if you have any questions.</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, margin: '40px 0' }}>{STEPS.map((s, i) => <div key={s} style={{ textAlign: 'center' }}>
          <div style={{ height: 3, borderRadius: 2, background: i <= step ? 'var(--gold)' : 'var(--line)', marginBottom: 10 }} /><small style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: i <= step ? 'var(--choc)' : 'var(--muted)' }}>{cap(s)}</small></div>)}</div>}
      {o.payment_method === 'bank_transfer' && o.payment_status !== 'paid' && <div className="note-box"><b>Payment by bank transfer:</b> {store.bank_details} Reference: <b>{o.number}</b> · Amount: <b>{money(o.total, cur)}</b></div>}
      <div className="summary" style={{ position: 'static' }}>
        {items.map((i: any) => <div className="line" key={i.id}><div className="th">{i.image_id && <img src={imgUrl(i.image_id)} alt="" />}</div>
          <div><div className="row"><h4>{i.name}</h4><b style={{ fontWeight: 500 }}>{money(i.unit_price * i.qty, cur)}</b></div><div className="meta">{i.color} · EU {i.size} · Qty {i.qty}</div></div></div>)}
        <div style={{ marginTop: 16 }}>
          <div className="tot"><span>Subtotal</span><span>{money(o.subtotal, cur)}</span></div>
          {Number(o.discount) > 0 && <div className="tot"><span>Discount {o.discount_code}</span><span>−{money(o.discount, cur)}</span></div>}
          <div className="tot"><span>{o.shipping_method}</span><span>{Number(o.shipping) ? money(o.shipping, cur) : 'Complimentary'}</span></div>
          <div className="tot big"><span>Total</span><span>{money(o.total, cur)}</span></div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--choc-2)' }}><b>Delivering to:</b> {o.name}, {o.address_line1}{o.address_line2 && `, ${o.address_line2}`}, {o.city} {o.postcode}, {o.country}<br />
          <b>Payment:</b> {o.payment_method === 'cod' ? 'Cash on delivery' : 'Bank transfer'} · {cap(o.payment_status)}</p>
      </div>
      <div className="center" style={{ marginTop: 30 }}><Link href="/collections/all" className="btn btn-dark">Continue Shopping</Link></div>
    </div>
  );
}
