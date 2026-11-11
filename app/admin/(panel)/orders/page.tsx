import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { fmtDate, money, STATUSES } from '@/lib/format';
import { PageHead, Pill } from '@/components/admin/bits';
export const metadata = { title: 'Orders' };
export default async function Orders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdminPage('orders');
  const sp = await searchParams; const q = (sp.q || '').trim(); const like = `%${q.replace(/[%_]/g, '')}%`;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(sp.from || '') ? sp.from : null, to = /^\d{4}-\d{2}-\d{2}$/.test(sp.to || '') ? sp.to : null;
  const status = (STATUSES as readonly string[]).includes(sp.status) ? sp.status : null;
  const pay = ['paid', 'unpaid', 'refunded'].includes(sp.payment) ? sp.payment : null;
  const store = await getContent('store');
  const [orders, counts] = await Promise.all([
    sql`select o.*, (select sum(qty) from order_items i where i.order_id = o.id)::int as items from orders o
      where (${q} = '' or o.number ilike ${like} or o.name ilike ${like} or o.email ilike ${like} or o.phone ilike ${like} or o.postcode ilike ${like})
      ${status ? sql`and o.status = ${status}` : sql``} ${pay ? sql`and o.payment_status = ${pay}` : sql``}
      ${from ? sql`and o.created_at >= ${from}::date` : sql``} ${to ? sql`and o.created_at < ${to}::date + 1` : sql``}
      order by o.created_at desc limit 300`,
    sql`select status, count(*)::int as n from orders group by status`
  ]);
  const n = (s: string) => counts.find((c: any) => c.status === s)?.n || 0;
  const link = (s?: string) => { const p = new URLSearchParams({ ...sp, status: s || '' }); if (!s) p.delete('status'); return `/admin/orders?${p}`; };
  const sum = orders.filter((o: any) => o.status !== 'cancelled').reduce((a: number, o: any) => a + Number(o.total), 0);
  return (<>
    <PageHead title="Orders" sub={`${orders.length} shown · ${money(Math.round(sum), store.currency)} excluding cancelled`} />
    <div className="tabs"><Link href={link()} className={!status ? 'on' : ''}>All ({counts.reduce((a: number, c: any) => a + c.n, 0)})</Link>{STATUSES.map(s => <Link key={s} href={link(s)} className={status === s ? 'on' : ''} style={{ textTransform: 'capitalize' }}>{s} ({n(s)})</Link>)}</div>
    <form className="filters">
      {status && <input type="hidden" name="status" value={status} />}
      <input className="inp" type="search" name="q" defaultValue={q} placeholder="Order no., name, email, phone, postcode" />
      <label className="muted" style={{ fontSize: 13 }}>From <input className="inp" type="date" name="from" defaultValue={from || ''} style={{ minWidth: 0 }} /></label>
      <label className="muted" style={{ fontSize: 13 }}>To <input className="inp" type="date" name="to" defaultValue={to || ''} style={{ minWidth: 0 }} /></label>
      <select className="inp" name="payment" defaultValue={pay || ''}><option value="">Any payment</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select>
      <button className="btn btn-line">Filter</button>{Object.values(sp).some(Boolean) && <Link className="link" href="/admin/orders">Clear</Link>}
    </form>
    <div className="panel"><div className="tbl-wrap"><table className="t">
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th className="right">Total</th></tr></thead>
      <tbody>{orders.map((o: any) => <tr key={o.id}>
        <td><Link className="link" href={`/admin/orders/${o.id}`} style={{ fontWeight: 500 }}>{o.number}</Link></td>
        <td className="nowrap muted">{fmtDate(o.created_at, true)}</td>
        <td>{o.name}<div className="muted" style={{ fontSize: 12.5 }}>{o.email}</div></td><td>{o.items}</td>
        <td><Pill s={o.payment_status} /><div className="muted" style={{ fontSize: 12 }}>{o.payment_method === 'cod' ? 'Cash on delivery' : o.payment_method === 'card' ? 'Card' : 'Bank transfer'}</div></td>
        <td><Pill s={o.status} /></td><td className="right nowrap">{money(o.total, store.currency)}</td></tr>)}</tbody></table>
      {!orders.length && <div className="empty-s">No orders match these filters.</div>}</div></div>
  </>);
}
