import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { PageHead } from '@/components/admin/bits';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { ActionButton, ActionForm, Submit } from '@/components/admin/ui';
import { deleteCategory, setCategoryProducts, updateCategory } from '@/app/admin/actions';
export const metadata = { title: 'Edit category' };
export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('categories');
  const { id } = await params; if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await sql`select * from categories where id = ${id}`; if (!c) notFound();
  const products = await sql`select p.id, p.name, p.active, exists (select 1 from product_categories pc where pc.product_id = p.id and pc.category_id = ${id}) as inside from products p order by p.name`;
  return (<>
    <PageHead title={c.name} sub={`/collections/${c.slug}`}>
      <a className="btn btn-line" href={`/collections/${c.slug}`} target="_blank" rel="noopener">View on site ↗</a><Link className="btn btn-line" href="/admin/categories">All categories</Link>
      <ActionButton action={deleteCategory} args={[c.id]} className="btn btn-danger" confirm={`Delete “${c.name}”? Products in it are kept.`}>Delete</ActionButton>
    </PageHead>
    <div className="cols-eq">
      <div className="panel"><h2 style={{ marginBottom: 16 }}>Details</h2><CategoryForm action={updateCategory.bind(null, c.id)} c={c} /></div>
      <div className="panel"><h2>Products in this category</h2><p className="sub">Tick the products that belong here.</p>
        <ActionForm action={setCategoryProducts.bind(null, c.id)}>
          <div style={{ maxHeight: 520, overflow: 'auto', marginBottom: 14 }}>{products.map((p: any) => <label className="check" key={p.id}><input type="checkbox" name="products" value={p.id} defaultChecked={p.inside} />{p.name}{!p.active && <span className="muted">(hidden)</span>}</label>)}</div>
          <Submit>Save products</Submit></ActionForm></div>
    </div>
  </>);
}
