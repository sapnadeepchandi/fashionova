'use client';
import { ActionButton, ActionForm, Submit, type Res } from './ui';
import { setPaymentStatus } from '@/app/admin/actions';
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export function OrderStatus({ action, o, mode }: { action: (p: Res | null, fd: FormData) => Promise<Res>; o: any; mode: string }) {
  return (<>
    <ActionForm key={o.status} action={action} reset>
      <div className="f" style={{ marginBottom: 12 }}><label htmlFor="status">Order status</label>
        <select id="status" name="status" defaultValue={o.status}>{STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div>
      <div className="f" style={{ marginBottom: 12 }}><label htmlFor="note">Internal note (optional)</label><textarea id="note" name="note" rows={2} placeholder="e.g. Tracking number RM123456789GB" /></div>
      <Submit>Update order</Submit>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>{o.stock_deducted ? 'Stock has been taken for this order. Cancelling returns it to inventory.' : `Stock is reduced automatically when the order is ${mode === 'paid' ? 'marked as paid' : mode === 'placed' ? 'placed' : 'confirmed'}.`}</p>
    </ActionForm>
    <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 16 }}><div className="lbl" style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Payment</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['unpaid', 'paid', 'refunded'].map(p => <ActionButton key={p} action={setPaymentStatus} args={[o.id, p]} className={'btn btn-sm ' + (o.payment_status === p ? 'btn-dark' : 'btn-line')} confirm={p === 'refunded' ? 'Mark this order as refunded?' : undefined}>{p}</ActionButton>)}</div></div>
  </>);
}
