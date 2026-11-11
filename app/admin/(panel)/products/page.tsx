import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { listCategories, listProducts } from '@/lib/catalog';
import { getContent } from '@/lib/content';
import { imgUrl, money } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { ActionButton } from '@/components/admin/ui';
import { toggleProduct } from '@/app/admin/actions';

export const metadata = { title: 'Products' };
export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdminPage('products');
  const sp = await searchParams;
  const [all, cats, store] = await Promise.all([listProducts({ includeInactive: true, q: sp.q, category: sp.category || undefined }), listCategories(false), getContent('store')]);
  const low = Number(store.low_stock_threshold);
  const list = all.filter(p =>
    (!sp.status || (sp.status === 'active' ? p.active : !p.active)) &&
    (!sp.flag || (sp.flag === 'sale' ? !!p.was : (p as any)[sp.flag])) &&
    (!sp.stock || (sp.stock === 'out' ? p.variants.some(v => v.stock === 0) : p.variants.some(v => v.stock <= low))));
  const Toggle = ({ p, f, label }: { p: any; f: any; label: string }) => <ActionButton action={toggleProduct} args={[p.id, f]} className={'pill ' + (p[f] ? 'on' : 'off')}>{label}</ActionButton>;
  return (<>
    <PageHead title="Products" sub={`${all.length} products · ${all.filter(p => p.active).length} live`}><Link href="/admin/products/new" className="btn btn-dark">＋ Add product</Link></PageHead>
    <form className="filters">
      <input className="inp" type="search" name="q" defaultValue={sp.q} placeholder="Search name, colour, material…" />
      <select className="inp" name="category" defaultValue={sp.category || ''}><option value="">All categories</option>{cats.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
      <select className="inp" name="status" defaultValue={sp.status || ''}><option value="">Any status</option><option value="active">Active</option><option value="inactive">Hidden</option></select>
      <select className="inp" name="flag" defaultValue={sp.flag || ''}><option value="">Any label</option><option value="is_new">New Arrival</option><option value="is_bestseller">Bestseller</option><option value="is_featured">Featured</option><option value="sale">On sale</option></select>
      <select className="inp" name="stock" defaultValue={sp.stock || ''}><option value="">Any stock</option><option value="low">Low stock</option><option value="out">Has sold-out sizes</option></select>
      <button className="btn btn-line">Filter</button>{Object.values(sp).some(Boolean) && <Link className="link" href="/admin/products">Clear</Link>}
    </form>
    <div className="panel"><div className="tbl-wrap"><table className="t">
      <thead><tr><th></th><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Homepage labels</th><th></th></tr></thead>
      <tbody>{list.map(p => { const outs = p.variants.filter(v => v.stock === 0).length; return <tr key={p.id}>
        <td style={{ width: 60 }}>{p.images[0] ? <img className="thumb" src={imgUrl(p.images[0])} alt="" /> : <div className="thumb" />}</td>
        <td><Link href={`/admin/products/${p.id}`} style={{ fontWeight: 500 }}>{p.name}</Link><div className="muted" style={{ fontSize: 12.5 }}>{p.categories.map(c => c.name).join(', ') || 'No category'} · {p.colors.length} colours</div></td>
        <td className="nowrap">{money(p.effective, store.currency)}{p.was && <div className="muted" style={{ fontSize: 12, textDecoration: 'line-through' }}>{money(p.was, store.currency)}</div>}</td>
        <td className="nowrap">{p.stock_total} pairs{outs > 0 && <div style={{ fontSize: 12, color: 'var(--bad)' }}>{outs} sizes sold out</div>}</td>
        <td><Toggle p={p} f="active" label={p.active ? 'Active' : 'Hidden'} /></td>
        <td><div className="tags"><Toggle p={p} f="is_new" label="New" /><Toggle p={p} f="is_bestseller" label="Bestseller" /><Toggle p={p} f="is_featured" label="Featured" /></div></td>
        <td className="right"><Link href={`/admin/products/${p.id}`} className="btn btn-line btn-sm">Edit</Link></td></tr>; })}</tbody></table>
      {!list.length && <div className="empty-s">No products match these filters.</div>}</div></div>
    <p className="muted" style={{ fontSize: 13 }}>Tip: click a label to switch it on or off. “New”, “Bestseller” and “Featured” control which products appear in those homepage sections.</p>
  </>);
}
