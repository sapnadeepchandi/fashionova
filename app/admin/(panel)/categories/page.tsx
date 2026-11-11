import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { listCategories } from '@/lib/catalog';
import { imgUrl } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { createCategory } from '@/app/admin/actions';
export const metadata = { title: 'Categories' };
export default async function Categories() {
  await requireAdminPage('categories');
  const cats = await listCategories(false);
  return (<>
    <PageHead title="Categories" sub="Organise products into collections. A product can belong to several categories." />
    <div className="cols">
      <div className="panel"><div className="tbl-wrap"><table className="t">
        <thead><tr><th></th><th>Category</th><th>Products</th><th>Menu</th><th>Homepage</th><th>Status</th><th></th></tr></thead>
        <tbody>{cats.map((c: any) => <tr key={c.id}>
          <td style={{ width: 60 }}>{c.image_id ? <img className="thumb" src={imgUrl(c.image_id)} alt="" /> : <div className="thumb" />}</td>
          <td><Link href={`/admin/categories/${c.id}`} style={{ fontWeight: 500 }}>{c.name}</Link><div className="muted" style={{ fontSize: 12.5 }}>/collections/{c.slug}</div></td>
          <td>{c.product_count}</td><td>{c.show_in_nav ? '✓' : '—'}</td><td>{c.show_on_home ? '✓' : '—'}</td><td><span className={'pill ' + (c.active ? 'on' : 'off')}>{c.active ? 'Active' : 'Hidden'}</span></td>
          <td className="right"><Link href={`/admin/categories/${c.id}`} className="btn btn-line btn-sm">Edit</Link></td></tr>)}</tbody></table>
        {!cats.length && <div className="empty-s">No categories yet.</div>}</div></div>
      <div className="panel"><h2>New category</h2><p className="sub">Add a collection such as “Bridal” or “Winter Boots”.</p><CategoryForm action={createCategory} reset /></div>
    </div>
  </>);
}
