import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { fmtDate, imgUrl, money } from '@/lib/format';
import { PageHead, Pill } from '@/components/admin/bits';
import { OrderStatus } from '@/components/admin/OrderStatus';
import { setOrderStatus } from '@/app/admin/actions';
export const metadata = { title: 'Order' };
export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('orders');
  const { id } = await params; if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [o] = await sql`select * from orders where id = ${id}`; if (!o) notFound();
  const [items, events, store] = await Promise.all([sql`select i.*, p.id as pid from order_items i left join products p on p.id = i.product_id where order_id = ${id}`, sql`select * from order_events where order_id = ${id} order by created_at desc, id desc`, getContent('store')]);
  const cur = store.currency;
  return (<>
    <PageHead title={`Order ${o.number}`} sub={`Placed ${fmtDate(o.created_at, true)}`}><Pill s={o.status} /><Pill s={o.payment_status} /><a className="btn btn-line btn-sm" href={`/order/${o.access_token}`} target="_blank" rel="noopener">Customer view ↗</a><Link className="btn btn-line btn-sm" href="/admin/orders">All orders</Link></PageHead>
    <div className="cols">
      <div>
        <div className="panel"><h2 style={{ marginBottom: 12 }}>Items</h2><div className="tbl-wrap"><table className="t"><tbody>{items.map((i: any) => <tr key={i.id}>
          <td style={{ width: 60 }}>{i.image_id ? <img className="thumb" src={imgUrl(i.image_id)} alt="" /> : <div className="thumb" />}</td>
          <td>{i.pid ? <Link href={`/admin/products/${i.pid}`} style={{ fontWeight: 500 }}>{i.name}</Link> : <b style={{ fontWeight: 500 }}>{i.name}</b>}<div className="muted" style={{ fontSize: 12.5 }}>{i.color} · EU {i.size}</div></td>
          <td className="nowrap">{i.qty} × {money(i.unit_price, cur)}</td><td className="right nowrap">{money(i.qty * i.unit_price, cur)}</td></tr>)}</tbody></table></div>
          <dl className="kv" style={{ marginTop: 16, maxWidth: 380, marginLeft: 'auto' }}>
            <dt>Subtotal</dt><dd className="right">{money(o.subtotal, cur)}</dd>
            {Number(o.discount) > 0 && <><dt>Discount {o.discount_code}</dt><dd className="right">−{money(o.discount, cur)}</dd></>}
            <dt>{o.shipping_method}</dt><dd className="right">{Number(o.shipping) ? money(o.shipping, cur) : 'Free'}</dd>
            <dt style={{ color: 'var(--choc)', fontWeight: 500 }}>Total</dt><dd className="right" style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>{money(o.total, cur)}</dd>
          </dl></div>
        <div className="cols-eq">
          <div className="panel"><h2 style={{ marginBottom: 12 }}>Customer</h2><dl className="kv">
            <dt>Name</dt><dd>{o.customer_id ? <Link className="link" href={`/admin/customers/${o.customer_id}`}>{o.name}</Link> : o.name}</dd>
            <dt>Email</dt><dd><a className="link" href={`mailto:${o.email}`}>{o.email}</a></dd><dt>Phone</dt><dd><a href={`tel:${o.phone}`}>{o.phone}</a></dd></dl></div>
          <div className="panel"><h2 style={{ marginBottom: 12 }}>Delivery</h2><p>{o.name}<br />{o.address_line1}{o.address_line2 && <><br />{o.address_line2}</>}<br />{o.city} {o.postcode}<br />{o.country}</p>
            {o.notes && <div className="alert warn" style={{ marginTop: 12 }}>Note: {o.notes}</div>}</div>
        </div>
        <div className="panel"><h2 style={{ marginBottom: 12 }}>Payment</h2><dl className="kv"><dt>Method</dt><dd>{o.payment_method === 'cod' ? 'Cash on delivery' : o.payment_method === 'card' ? 'Card' : 'Bank transfer'}</dd><dt>Status</dt><dd><Pill s={o.payment_status} /></dd><dt>Amount</dt><dd>{money(o.total, cur)}</dd></dl></div>
      </div>
      <div>
        <div className="panel"><h2 style={{ marginBottom: 14 }}>Update</h2><OrderStatus action={setOrderStatus.bind(null, o.id)} o={o} mode={store.stock_deduct_on} /></div>
        <div className="panel"><h2 style={{ marginBottom: 14 }}>History</h2><div className="timeline">{events.map((e: any) => <div key={e.id}><span>{e.message}<small>{fmtDate(e.created_at, true)} · {e.actor}</small></span></div>)}</div></div>
      </div>
    </div>
  </>);
}
