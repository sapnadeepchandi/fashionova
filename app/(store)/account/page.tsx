import Link from 'next/link';
import { getCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { cap, fmtDate, money } from '@/lib/format';
import { LoginForm, ProfileForm, RegisterForm } from '@/components/store/Forms';
import { logout } from '../actions';

export const metadata = { title: 'My Account' };
export default async function Account() {
  const c = await getCustomer();
  const hero = (t: string, s?: string) => <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / Account</div><h1>{t}</h1>{s && <p>{s}</p>}</div></section>;
  if (!c) return (<>{hero('My Account')}<div className="wrap"><div className="acct"><LoginForm /><RegisterForm /></div></div></>);
  const orders = await sql`select number, access_token, created_at, status, total, (select sum(qty) from order_items i where i.order_id = o.id)::int as items from orders o where customer_id = ${c.id} order by created_at desc`;
  const { currency } = await getContent('store');
  return (<>
    {hero(`Welcome, ${c.name.split(' ')[0] || 'back'}`, c.email)}
    <div className="wrap" style={{ maxWidth: 1080, paddingTop: 50 }}>
      <h2 style={{ fontSize: 32, marginBottom: 16 }}>Your Orders</h2>
      {orders.length ? <div style={{ overflowX: 'auto' }}><table className="orders-table"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th><th /></tr></thead>
        <tbody>{orders.map((o: any) => <tr key={o.number}><td>{o.number}</td><td>{fmtDate(o.created_at)}</td><td>{o.items}</td><td><span className="status-pill">{cap(o.status)}</span></td><td>{money(o.total, currency)}</td><td><Link className="link-u" href={`/order/${o.access_token}`}>View</Link></td></tr>)}</tbody></table></div>
        : <div className="empty"><p>You haven’t placed any orders yet.</p><Link href="/collections/all" className="btn btn-dark">Start Shopping</Link></div>}
      <h2 style={{ fontSize: 32, margin: '60px 0 16px' }}>Your Details</h2>
      <ProfileForm c={c} />
      <form action={logout} style={{ marginTop: 40 }}><button className="btn btn-line">Sign Out</button></form>
    </div>
  </>);
}
