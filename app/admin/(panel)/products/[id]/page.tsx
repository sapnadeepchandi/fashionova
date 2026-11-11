import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { listCategories, listProducts } from '@/lib/catalog';
import { getContent } from '@/lib/content';
import { PageHead } from '@/components/admin/bits';
import { ProductForm } from '@/components/admin/ProductForm';
import { ActionButton } from '@/components/admin/ui';
import { deleteProduct, duplicateProduct, updateProduct } from '@/app/admin/actions';
export const metadata = { title: 'Edit product' };
export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('products');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [[p], cats, store] = await Promise.all([listProducts({ includeInactive: true, ids: [id] }), listCategories(false), getContent('store')]);
  if (!p) notFound();
  return (<>
    <PageHead title={p.name} sub={p.active ? 'Live on the website' : 'Hidden from the website'}>
      <a href={`/products/${p.slug}`} target="_blank" rel="noopener" className="btn btn-line">View on site ↗</a>
      <ActionButton action={duplicateProduct} args={[p.id]} className="btn btn-line">Duplicate</ActionButton>
      <ActionButton action={deleteProduct} args={[p.id]} className="btn btn-danger" confirm={`Delete “${p.name}”? This cannot be undone. Past orders keep their details.`}>Delete</ActionButton>
    </PageHead>
    <ProductForm action={updateProduct.bind(null, p.id)} product={p} categories={cats} lowStock={Number(store.low_stock_threshold)} />
  </>);
}
