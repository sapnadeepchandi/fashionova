'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { PendingCtx, useAction } from '@/lib/useAction';
import { quote, submitOrder } from '@/app/(store)/actions';
import { img, money, useStore } from './StoreProvider';
import { Field, Submit } from './Forms';
import { Icon } from './Icons';

export function Checkout({ customer }: { customer: any }) {
  const { cart, ready, clear, currency, toast, replaceCart } = useStore();
  const router = useRouter();
  const [q, setQ] = useState<any>(null);
  const [code, setCode] = useState(''); const [applied, setApplied] = useState('');
  const [ship, setShip] = useState('standard'); const [pay, setPay] = useState('cod');
  const [, start] = useTransition();
  const [state, onSubmit, placing] = useAction(submitOrder);
  const lines = cart.map(l => ({ variant_id: l.variant_id, qty: l.qty }));
  const key = JSON.stringify(lines);

  useEffect(() => { if (!ready) return; start(async () => setQ(await quote(lines, applied))); }, [ready, key, applied]); // eslint-disable-line
  useEffect(() => { if (q?.payments && !q.payments.cod && q.payments.bank) setPay('bank_transfer'); }, [q?.payments]);
  useEffect(() => {
    if (!state) return;
    if (state.ok) { clear(); router.push(`/order/${state.data.token}`); }
    else { toast(state.message || 'Something went wrong'); start(async () => setQ(await quote(lines, applied))); }
  }, [state]); // eslint-disable-line
  // keep the bag in step with live prices
  useEffect(() => { if (q?.items) { const changed = cart.some(l => { const i = q.items.find((x: any) => x.variant_id === l.variant_id); return !i || i.unit_price !== l.price; }); if (changed) replaceCart(cart.filter(l => q.items.some((x: any) => x.variant_id === l.variant_id)).map(l => ({ ...l, price: q.items.find((x: any) => x.variant_id === l.variant_id).unit_price }))); } }, [q]); // eslint-disable-line

  async function applyCode() {
    const r = await quote(lines, code);
    if (r.discount.ok && r.discount.amount > 0) { setApplied(code); setQ(r); toast(`Code applied — ${(r.discount as any).label}`); }
    else { toast((r.discount as any).message || 'Enter a promo code'); setApplied(''); }
  }
  if (!ready || (!q && cart.length)) return <div className="done"><div className="spinner" style={{ margin: '0 auto', color: 'var(--gold)' }} /></div>;
  if (!cart.length) return <div className="done"><div className="tick"><Icon n="bag" /></div><h1>Your bag is empty</h1><p>Add a pair or two before heading to checkout.</p><Link className="btn btn-dark" href="/collections/all" style={{ marginTop: 20 }}>Continue Shopping</Link></div>;

  const shipOpt = q.shipping.find((s: any) => s.id === ship) || q.shipping[0];
  const total = Math.round((q.subtotal - (q.discount.amount || 0) + shipOpt.price) * 100) / 100;
  const e = state?.errors || {};
  return (
    <div className="wrap"><div className="co">
      <PendingCtx.Provider value={placing}><form onSubmit={onSubmit} noValidate>
        <div className="co-steps" style={{ paddingTop: 10 }}><span>Bag</span> › <b>Details</b> › Delivery › Payment</div>
        <h1 style={{ fontSize: 'clamp(38px,4vw,52px)', fontWeight: 400, marginBottom: 34 }}>Checkout</h1>
        {state && !state.ok && <div className="err-box">{state.message}</div>}
        {q.problems.length > 0 && <div className="err-box">{q.problems.join(' ')} Please update your bag.</div>}
        <input type="hidden" name="lines" value={key} />
        <input type="hidden" name="discount_code" value={applied} />
        <div className="co-sec"><h3><i>1</i>Contact</h3><div className="fields">
          <Field label="Email address" name="email" type="email" full errors={e} defaultValue={customer?.email} autoComplete="email" />
          <Field label="Phone number" name="phone" type="tel" full errors={e} defaultValue={customer?.phone} autoComplete="tel" />
        </div></div>
        <div className="co-sec"><h3><i>2</i>Delivery address</h3><div className="fields">
          <Field label="Full name" name="name" full errors={e} defaultValue={customer?.name} autoComplete="name" />
          <Field label="Address" name="address_line1" full errors={e} defaultValue={customer?.address_line1} autoComplete="address-line1" />
          <Field label="Apartment, suite (optional)" name="address_line2" full required={false} defaultValue={customer?.address_line2} autoComplete="address-line2" />
          <Field label="City" name="city" errors={e} defaultValue={customer?.city} autoComplete="address-level2" />
          <Field label="Postcode" name="postcode" errors={e} defaultValue={customer?.postcode} autoComplete="postal-code" />
          <div className="fld full"><select id="country" name="country" defaultValue={customer?.country || 'United Kingdom'}>{['United Kingdom', 'Ireland', 'France', 'Germany', 'United Arab Emirates', 'Sri Lanka', 'United States'].map(c => <option key={c}>{c}</option>)}</select><label htmlFor="country">Country</label></div>
          <Field label="Delivery notes (optional)" name="notes" full required={false} textarea />
        </div></div>
        <div className="co-sec"><h3><i>3</i>Delivery method</h3><div className="ship-opts">
          {q.shipping.map((s: any) => <label className="ship-opt" key={s.id}><span className="l"><input type="radio" name="shipping_method" value={s.id} checked={ship === s.id} onChange={() => setShip(s.id)} /><span><b style={{ fontWeight: 500 }}>{s.label}</b><small>{s.note}</small></span></span><b style={{ fontWeight: 500 }}>{s.price ? money(s.price, currency) : 'Free'}</b></label>)}
        </div></div>
        <div className="co-sec"><h3><i>4</i>Payment</h3>
          <div className="ship-opts">
            {q.payments.cod && <label className="ship-opt"><span className="l"><input type="radio" name="payment_method" value="cod" checked={pay === 'cod'} onChange={() => setPay('cod')} /><span><b style={{ fontWeight: 500 }}>Cash on delivery</b><small>Pay when your order arrives</small></span></span></label>}
            {q.payments.bank && <label className="ship-opt"><span className="l"><input type="radio" name="payment_method" value="bank_transfer" checked={pay === 'bank_transfer'} onChange={() => setPay('bank_transfer')} /><span><b style={{ fontWeight: 500 }}>Bank transfer</b><small>We’ll confirm your order once payment arrives</small></span></span></label>}
          </div>
          {pay === 'bank_transfer' && <div className="note-box" style={{ marginTop: 12 }}>{q.payments.bank_details}</div>}
        </div>
        <label className="opt" style={{ marginBottom: 20 }}><span className="l"><input type="checkbox" name="marketing" value="1" /><span className="bx" />Send me news about new collections and private previews</span></label>
        <Submit className="btn btn-dark btn-block">Place Order — {money(total, currency)}</Submit>
        <div className="secure"><Icon n="lock" /> Your details are sent securely and never shared.</div>
      </form></PendingCtx.Provider>
      <aside className="summary">
        <h3>Order Summary</h3>
        <div>{q.items.map((i: any) => <div className="line" key={i.variant_id}><Link className="th" href={`/products/${i.slug}`}>{i.image_id && <img src={img(i.image_id)} alt="" />}</Link>
          <div><div className="row" style={{ alignItems: 'flex-start' }}><h4>{i.name}</h4><b style={{ fontWeight: 500 }}>{money(i.unit_price * i.qty, currency)}</b></div><div className="meta">{i.color} · EU {i.size} · Qty {i.qty}</div></div></div>)}</div>
        <div className="promo"><input value={code} onChange={ev => setCode(ev.target.value)} placeholder="Promo code" aria-label="Promo code" /><button type="button" onClick={applyCode}>Apply</button></div>
        <div className="tot"><span>Subtotal</span><span>{money(q.subtotal, currency)}</span></div>
        {q.discount.amount > 0 && <div className="tot" style={{ color: 'var(--gold-d)' }}><span>{q.discount.code} ({q.discount.label})</span><span>−{money(q.discount.amount, currency)}</span></div>}
        <div className="tot"><span>Delivery</span><span>{shipOpt.price ? money(shipOpt.price, currency) : 'Complimentary'}</span></div>
        <div className="tot big" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 14 }}><span>Total</span><span>{money(total, currency)}</span></div>
        <small style={{ color: 'var(--muted)' }}>Including VAT · Free 30-day returns</small>
      </aside>
    </div></div>
  );
}
