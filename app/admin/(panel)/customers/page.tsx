import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { fmtDate, money } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
export const metadata = { title: 'Customers' };
export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireAdminPage('customers');
  const { q = '', type = '' } = await searchParams; const like = `%${q.trim().replace(/[%_]/g, '')}%`;
  const store = await getContent('store');
  const rows = await sql`select c.*, count(o.id)::int as orders, coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as spent, max(o.created_at) as last_order
    from customers c left join orders o on o.customer_id = c.id
    where (${q} = '' or c.name ilike ${like} or c.email ilike ${like} or c.phone ilike ${like} or c.city ilike ${like})
      ${type === 'registered' ? sql`and c.password_hash is not null` : type === 'guest' ? sql`and c.password_hash is null` : sql``}
    group by c.id order by max(o.created_at) desc nulls last, c.created_at desc limit 500`;
  return (<>
    <PageHead title="Customers" sub={`${rows.length} customers`} />
    <form className="filters"><input className="inp" type="search" name="q" defaultValue={q} placeholder="Name, email, phone or city" />
      <select className="inp" name="type" defaultValue={type}><option value="">All customers</option><option value="registered">Registered accounts</option><option value="guest">Guest checkout</option></select>
      <button className="btn btn-line">Search</button>{(q || type) && <Link className="link" href="/admin/customers">Clear</Link>}</form>
    <div className="panel"><div className="tbl-wrap"><table className="t">
      <thead><tr><th>Customer</th><th>Contact</th><th>Location</th><th>Account</th><th>Orders</th><th>Last order</th><th className="right">Total spent</th></tr></thead>
      <tbody>{rows.map((c: any) => <tr key={c.id}>
        <td><Link className="link" href={`/admin/customers/${c.id}`} style={{ fontWeight: 500 }}>{c.name || '—'}</Link><div className="muted" style={{ fontSize: 12 }}>Since {fmtDate(c.created_at)}</div></td>
        <td>{c.email}<div className="muted" style={{ fontSize: 12.5 }}>{c.phone}</div></td><td>{c.city || '—'}</td>
        <td><span className={'pill ' + (c.password_hash ? 'on' : 'off')}>{c.password_hash ? 'Registered' : 'Guest'}</span></td>
        <td>{c.orders}</td><td className="muted nowrap">{c.last_order ? fmtDate(c.last_order) : '—'}</td><td className="right">{money(Math.round(c.spent * 100) / 100, store.currency)}</td></tr>)}</tbody></table>
      {!rows.length && <div className="empty-s">No customers found.</div>}</div></div>
  </>);
}
