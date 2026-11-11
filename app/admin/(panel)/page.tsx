import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { fmtDate, imgUrl, money } from '@/lib/format';
import { PageHead, Pill, SalesChart } from '@/components/admin/bits';

export const metadata = { title: 'Dashboard' };
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const a = await requireAdminPage('dashboard');
  const { denied } = await searchParams;
  const store = await getContent('store'); const cur = store.currency; const low = Number(store.low_stock_threshold);
  const [[t], months, recent, lowStock, best] = await Promise.all([
    sql`select (select count(*) from products)::int as products, (select count(*) from products where active)::int as active_products,
      (select count(*) from orders)::int as orders, (select count(*) from orders where status = 'pending')::int as pending,
      (select count(*) from customers)::int as customers, (select count(*) from customers where created_at > now() - interval '30 days')::int as new_customers,
      (select coalesce(sum(total),0) from orders where status <> 'cancelled') as revenue,
      (select coalesce(sum(total),0) from orders where status <> 'cancelled' and created_at >= date_trunc('month', now())) as month_revenue,
      (select count(*) from product_variants v join products p on p.id = v.product_id where p.active and v.stock = 0)::int as out_of_stock`,
    sql`select to_char(m, 'Mon') as label, coalesce(sum(o.total),0) as total, count(o.id)::int as orders
        from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
        left join orders o on date_trunc('month', o.created_at) = m and o.status <> 'cancelled' group by m order by m`,
    sql`select id, number, name, total, status, payment_status, created_at from orders order by created_at desc limit 8`,
    sql`select v.id, v.color, v.size, v.stock, p.id as product_id, p.name from product_variants v join products p on p.id = v.product_id where p.active and v.stock <= ${low} order by v.stock, p.name limit 10`,
    sql`select p.id, p.name, sum(i.qty)::int as qty, sum(i.qty * i.unit_price) as revenue, (select image_id from product_images pi where pi.product_id = p.id order by sort_order limit 1) as image
        from order_items i join orders o on o.id = i.order_id join products p on p.id = i.product_id where o.status <> 'cancelled' group by p.id order by qty desc limit 5`
  ]);
  return (<>
    {denied && <div className="alert warn">Your role doesn’t have access to that area.</div>}
    <PageHead title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${a.name.split(' ')[0]}`} sub="Here’s how the boutique is doing." />
    <div className="stats">
      <Link href="/admin/products" className="stat"><small>Total products</small><b>{t.products}</b><span>{t.active_products} live on the website</span></Link>
      <Link href="/admin/orders" className="stat"><small>Total orders</small><b>{t.orders}</b><span>{t.pending} awaiting confirmation</span></Link>
      <Link href="/admin/customers" className="stat"><small>Total customers</small><b>{t.customers}</b><span>{t.new_customers} new in the last 30 days</span></Link>
      <div className="stat"><small>Total revenue</small><b>{money(Math.round(t.revenue), cur)}</b><span>{money(Math.round(t.month_revenue), cur)} this month</span></div>
    </div>
    <div className="cols">
      <div>
        <div className="panel"><div className="panel-head"><div><h2>Monthly sales</h2><p className="sub" style={{ margin: 0 }}>Last 12 months, excluding cancelled orders</p></div></div>
          <SalesChart data={months.map((m: any) => ({ label: m.label, total: Number(m.total), orders: m.orders }))} cur={cur} /></div>
        <div className="panel"><div className="panel-head"><h2>Recent orders</h2><Link className="link" href="/admin/orders">View all</Link></div>
          <div className="tbl-wrap"><table className="t"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Payment</th><th className="right">Total</th></tr></thead>
            <tbody>{recent.map((o: any) => <tr key={o.id}><td><Link className="link" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td>{o.name}</td><td className="nowrap muted">{fmtDate(o.created_at)}</td><td><Pill s={o.status} /></td><td><Pill s={o.payment_status} /></td><td className="right">{money(o.total, cur)}</td></tr>)}</tbody></table></div></div>
      </div>
      <div>
        <div className="panel"><div className="panel-head"><h2>Low stock</h2><Link className="link" href="/admin/inventory?filter=low">Inventory</Link></div>
          {t.out_of_stock > 0 && <div className="alert err">{t.out_of_stock} {t.out_of_stock === 1 ? 'size is' : 'sizes are'} out of stock.</div>}
          {lowStock.length ? <table className="t"><tbody>{lowStock.map((v: any) => <tr key={v.id}><td><Link href={`/admin/products/${v.product_id}`}>{v.name}</Link><div className="muted" style={{ fontSize: 12.5 }}>{v.color} · EU {v.size}</div></td><td className="right"><span className={'pill ' + (v.stock ? 'low' : 'out')}>{v.stock ? `${v.stock} left` : 'Out'}</span></td></tr>)}</tbody></table> : <p className="muted">All sizes are well stocked.</p>}</div>
        <div className="panel"><h2 style={{ marginBottom: 14 }}>Best sellers</h2>
          {best.length ? <table className="t"><tbody>{best.map((b: any, i: number) => <tr key={b.id}><td style={{ width: 56 }}>{b.image && <img className="thumb" src={imgUrl(b.image)} alt="" />}</td><td><Link href={`/admin/products/${b.id}`}>{b.name}</Link><div className="muted" style={{ fontSize: 12.5 }}>{b.qty} sold · {money(Math.round(b.revenue), cur)}</div></td><td className="right muted">#{i + 1}</td></tr>)}</tbody></table> : <p className="muted">No sales yet.</p>}</div>
      </div>
    </div>
  </>);
}
