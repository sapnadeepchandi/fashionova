import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { listCategories } from '@/lib/catalog';
import { getContent } from '@/lib/content';
import { PageHead } from '@/components/admin/bits';
import { ProductForm } from '@/components/admin/ProductForm';
import { createProduct } from '@/app/admin/actions';
export const metadata = { title: 'New product' };
export default async function NewProduct() {
  await requireAdminPage('products');
  const [cats, store] = await Promise.all([listCategories(false), getContent('store')]);
  return (<><PageHead title="Add product" sub="Fill in the details, add photos and set stock for each colour and size."><Link href="/admin/products" className="btn btn-line">Cancel</Link></PageHead>
    <ProductForm action={createProduct} categories={cats} lowStock={Number(store.low_stock_threshold)} /></>);
}
