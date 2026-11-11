import Link from 'next/link';
import { listCategories, listProducts } from '@/lib/catalog';
import { toCard } from '@/lib/serialize';
import { ShopClient } from '@/components/store/ShopClient';

export const metadata = { title: 'Search' };
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q || '').slice(0, 60);
  const [products, cats] = await Promise.all([q ? listProducts({ q }) : [], listCategories()]);
  return (<>
    <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / Search</div><h1>{q ? <>Results for “{q}”</> : 'Search'}</h1><p>{products.length} {products.length === 1 ? 'style' : 'styles'} found</p></div></section>
    <ShopClient key={q} products={products.map(toCard)} cats={cats.map((c: any) => ({ name: c.name, slug: c.slug }))} />
  </>);
}
