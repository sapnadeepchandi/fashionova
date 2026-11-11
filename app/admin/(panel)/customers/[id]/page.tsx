import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { fmtDate, money } from '@/lib/format';
import { PageHead, Pill } from '@/components/admin/bits';
export const metadata = { title: 'Customer' };
export default async function Customer({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('customers');
  const { id } = await params; if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await sql`select * from customers where id = ${id}`; if (!c) notFound();
  const [orders, store, [sub]] = await Promise.all([sql`select o.*, (select sum(qty) from order_items i where i.order_id = o.id)::int as items from orders o where customer_id = ${id} order by created_at desc`, getContent('store'), sql`select 1 from newsletter_subscribers where email = ${c.email}`]);
  const spent = orders.filter((o: any) => o.status !== 'cancelled').reduce((a: number, o: any) => a + Number(o.total), 0);
  return (<>
    <PageHead title={c.name || c.email} sub={`Customer since ${fmtDate(c.created_at)}`}><Link className="btn btn-line" href="/admin/customers">All customers</Link></PageHead>
    <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}><div className="stat"><small>Orders</small><b>{orders.length}</b></div><div className="stat"><small>Total spent</small><b>{money(Math.round(spent), store.currency)}</b></div><div className="stat"><small>Average order</small><b>{money(orders.length ? Math.round(spent / Math.max(1, orders.filter((o: any) => o.status !== 'cancelled').length)) : 0, store.currency)}</b></div></div>
    <div className="cols">
      <div className="panel"><h2 style={{ marginBottom: 12 }}>Order history</h2><div className="tbl-wrap"><table className="t"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Payment</th><th className="right">Total</th></tr></thead>
        <tbody>{orders.map((o: any) => <tr key={o.id}><td><Link className="link" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td className="muted">{fmtDate(o.created_at)}</td><td>{o.items}</td><td><Pill s={o.status} /></td><td><Pill s={o.payment_status} /></td><td className="right">{money(o.total, store.currency)}</td></tr>)}</tbody></table>
        {!orders.length && <div className="empty-s">No orders yet.</div>}</div></div>
      <div className="panel"><h2 style={{ marginBottom: 12 }}>Contact details</h2><dl className="kv">
        <dt>Email</dt><dd><a className="link" href={`mailto:${c.email}`}>{c.email}</a></dd><dt>Phone</dt><dd>{c.phone || '—'}</dd>
        <dt>Address</dt><dd>{c.address_line1 ? <>{c.address_line1}{c.address_line2 && <>, {c.address_line2}</>}<br />{c.city} {c.postcode}<br />{c.country}</> : '—'}</dd>
        <dt>Account</dt><dd>{c.password_hash ? 'Registered' : 'Guest checkout'}</dd><dt>Newsletter</dt><dd>{sub || c.marketing_opt_in ? 'Subscribed' : 'Not subscribed'}</dd></dl></div>
    </div>
  </>);
}
