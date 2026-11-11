import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listCategories, listProducts } from '@/lib/catalog';
import { toCard } from '@/lib/serialize';
import { ShopClient } from '@/components/store/ShopClient';

const SPECIAL: Record<string, { t: string; d: string; flag?: any }> = {
  all: { t: 'Shop All', d: 'The complete collection — heels, flats, sandals and sneakers.' },
  'new-arrivals': { t: 'New Arrivals', d: 'The newest silhouettes, made in limited runs.', flag: 'is_new' },
  'best-sellers': { t: 'Best Sellers', d: 'The pairs our clients return to again and again.', flag: 'is_bestseller' },
  featured: { t: 'Featured Styles', d: 'Hand-picked by our editors.', flag: 'is_featured' },
  sale: { t: 'Sale', d: 'Selected styles, beautifully reduced.', flag: 'sale' }
};

async function resolve(slug: string) {
  const cats = await listCategories();
  const cat = cats.find((c: any) => c.slug === slug);
  const sp = SPECIAL[slug];
  if (!sp && !cat) return null;
  return { cats, cat, title: sp?.t || cat.name, desc: sp?.d || cat.description, products: await listProducts(sp ? { flag: sp.flag } : { category: slug }) };
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const r = SPECIAL[slug]; return { title: r?.t || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
}
export default async function Collection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  return (<>
    <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / {r.title}</div><h1>{r.title}</h1><p>{r.desc}</p></div></section>
    <ShopClient key={slug} products={r.products.map(toCard)} cats={r.cats.map((c: any) => ({ name: c.name, slug: c.slug }))} lockCategory={r.cat?.slug} />
  </>);
}
