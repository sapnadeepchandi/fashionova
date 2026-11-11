import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, listProducts } from '@/lib/catalog';
import { getAllContent } from '@/lib/content';
import { toCard } from '@/lib/serialize';
import { money } from '@/lib/format';
import { ProductDetail } from '@/components/store/ProductDetail';
import { Grid } from '@/components/store/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const { store } = await getAllContent(['store']);
  const primary = p.categories[0];
  const related = (primary ? await listProducts({ category: primary.slug, limit: 5 }) : []).filter(x => x.id !== p.id).slice(0, 4);
  const shipping = `Standard delivery ${money(store.standard_rate, store.currency)}, complimentary on orders over ${money(store.free_shipping_threshold, store.currency)}. Express ${money(store.express_rate, store.currency)}, next-day ${money(store.nextday_rate, store.currency)}.`;
  return (
    <div className="wrap">
      <div className="crumbs" style={{ paddingTop: 30 }}><Link href="/">Home</Link>{primary && <> / <Link href={`/collections/${primary.slug}`}>{primary.name}</Link></>} / {p.name}</div>
      <ProductDetail p={{ ...toCard(p), images: p.images, description: p.description, heel: p.heel, material: p.material, details: p.details }}
        extra={{ store, shipping, returns: 'Free returns and exchanges within 30 days of delivery. Items must be unworn and in their original packaging.' }} />
      {related.length > 0 && <section className="sec" style={{ paddingBottom: 0 }}>
        <div className="sec-head"><div><span className="eyebrow">Complete the look</span><h2 className="h-sec" style={{ marginTop: 10 }}>You May Also Love</h2></div>{primary && <Link href={`/collections/${primary.slug}`} className="link-u">View all {primary.name}</Link>}</div>
        <Grid products={related.map(toCard)} />
      </section>}
    </div>
  );
}
