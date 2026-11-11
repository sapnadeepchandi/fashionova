'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from './StoreProvider';
import { Grid } from './ProductCard';
export function Wishlist() {
  const { wish, ready } = useStore();
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { if (!ready) return; if (!wish.length) { setItems([]); return; }
    fetch('/api/products?slugs=' + wish.join(',')).then(r => r.json()).then(d => setItems(d.items)).catch(() => setItems([])); }, [ready, wish.join(',')]); // eslint-disable-line
  const shown = (items || []).filter(p => wish.includes(p.slug));
  return (<>
    <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / Wishlist</div><h1>Your Wishlist</h1><p>{shown.length ? `${shown.length} saved ${shown.length === 1 ? 'style' : 'styles'} — ready when you are.` : 'Save the pairs you love by tapping the heart.'}</p></div></section>
    <div className="wrap" style={{ paddingTop: 50 }}>{items === null ? null : shown.length ? <Grid products={shown} /> :
      <div className="empty"><h3>Nothing saved yet</h3><p>Tap the heart on any style to keep it here.</p><Link className="btn btn-dark" href="/collections/all">Explore the Collection</Link></div>}</div>
  </>);
}
