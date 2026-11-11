import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { listCategories } from '@/lib/catalog';
import { fmtDate, imgUrl, money } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { ActionButton } from '@/components/admin/ui';
import { CampaignForm, CodeForm, SalePriceForm } from '@/components/admin/PromoForms';
import { createCampaign, createCode, deleteCampaign, deleteCode, setSalePrice, toggleCode } from '@/app/admin/actions';
export const metadata = { title: 'Promotions' };
const state = (c: any) => { const n = Date.now();
  if (!c.active) return ['off', 'Paused']; if (c.starts_at && new Date(c.starts_at).getTime() > n) return ['pending', 'Scheduled'];
  const end = c.expires_at ?? c.ends_at; if (end && new Date(end).getTime() < n) return ['cancelled', 'Expired'];
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return ['cancelled', 'Used up']; return ['on', 'Live']; };
export default async function Promotions() {
  await requireAdminPage('promotions');
  const [codes, camps, cats, products, store] = await Promise.all([sql`select * from discount_codes order by created_at desc`, sql`select c.*, k.name as category from campaigns c left join categories k on k.id = c.category_id order by starts_at desc`, listCategories(false),
    sql`select p.id, p.name, p.price, p.sale_price, (select image_id from product_images pi where pi.product_id = p.id order by sort_order limit 1) as image from products p order by (p.sale_price is null), p.name`, getContent('store')]);
  const cur = store.currency;
  return (<>
    <PageHead title="Promotions & discounts" sub="Discount codes for checkout, timed campaigns, and individual sale prices." />
    <div className="cols">
      <div className="panel"><h2 style={{ marginBottom: 12 }}>Discount codes</h2><div className="tbl-wrap"><table className="t">
        <thead><tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead>
        <tbody>{codes.map((c: any) => { const [k, t] = state(c); return <tr key={c.id}>
          <td><Link className="link" href={`/admin/promotions/codes/${c.id}`} style={{ fontWeight: 500 }}>{c.code}</Link><div className="muted" style={{ fontSize: 12 }}>{c.description}</div></td>
          <td>{c.kind === 'percent' ? `${Number(c.value)}%` : money(c.value, cur)}</td><td>{Number(c.min_order) ? money(c.min_order, cur) : '—'}</td>
          <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td><td className="muted nowrap">{c.expires_at ? fmtDate(c.expires_at) : 'Never'}</td><td><span className={'pill ' + k}>{t}</span></td>
          <td className="right nowrap"><ActionButton action={toggleCode} args={[c.id]}>{c.active ? 'Pause' : 'Activate'}</ActionButton> <ActionButton action={deleteCode} args={[c.id]} className="btn btn-danger btn-sm" confirm={`Delete code ${c.code}?`}>Delete</ActionButton></td></tr>; })}</tbody></table>
        {!codes.length && <div className="empty-s">No codes yet.</div>}</div></div>
      <div className="panel"><h2>New discount code</h2><p className="sub">Customers enter it at checkout.</p><CodeForm action={createCode} /></div>
    </div>
    <div className="cols">
      <div className="panel"><h2>Campaigns</h2><p className="sub">Automatic percentage discounts for a period — prices update across the site and show as sale.</p><div className="tbl-wrap"><table className="t">
        <thead><tr><th>Campaign</th><th>Discount</th><th>Applies to</th><th>Dates</th><th>Status</th><th></th></tr></thead>
        <tbody>{camps.map((c: any) => { const [k, t] = state(c); return <tr key={c.id}><td><Link className="link" href={`/admin/promotions/campaigns/${c.id}`} style={{ fontWeight: 500 }}>{c.name}</Link></td><td>{Number(c.percent_off)}%</td><td>{c.category || 'Whole store'}</td>
          <td className="muted nowrap">{fmtDate(c.starts_at)} – {fmtDate(c.ends_at)}</td><td><span className={'pill ' + k}>{t}</span></td>
          <td className="right"><ActionButton action={deleteCampaign} args={[c.id]} className="btn btn-danger btn-sm" confirm={`Delete campaign ${c.name}?`}>Delete</ActionButton></td></tr>; })}</tbody></table>
        {!camps.length && <div className="empty-s">No campaigns yet.</div>}</div></div>
      <div className="panel"><h2>New campaign</h2><p className="sub">e.g. “Sandal Week — 10% off sandals”.</p><CampaignForm action={createCampaign} cats={cats} /></div>
    </div>
    <div className="panel"><h2>Sale products</h2><p className="sub">Give individual products a sale price. Leave empty and press Set to take a product off sale.</p><div className="tbl-wrap"><table className="t">
      <thead><tr><th></th><th>Product</th><th>Regular price</th><th>Sale price</th><th>Saving</th></tr></thead>
      <tbody>{products.map((p: any) => <tr key={p.id}><td style={{ width: 56 }}>{p.image && <img className="thumb" src={imgUrl(p.image)} alt="" />}</td><td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td><td>{money(p.price, cur)}</td>
        <td><SalePriceForm action={setSalePrice.bind(null, p.id)} value={p.sale_price} /></td><td>{p.sale_price != null ? <span className="pill cancelled">−{Math.round((1 - p.sale_price / p.price) * 100)}%</span> : <span className="muted">—</span>}</td></tr>)}</tbody></table></div></div>
  </>);
}
