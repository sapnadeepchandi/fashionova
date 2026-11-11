'use client';
import Link from 'next/link';
import { useState } from 'react';
import { img, money, useStore } from './StoreProvider';
import { Icon } from './Icons';

export type CardProduct = {
  slug: string; name: string; effective: number; was: number | null; images: string[];
  colors: { name: string; hex: string }[]; variants: { id: string; color: string; size: number; stock: number }[];
  categories: { name: string; slug: string }[]; is_new: boolean; is_bestseller: boolean; stock_total: number;
};
const SIZES = [35, 36, 37, 38, 39, 40, 41, 42];

export function Labels({ p }: { p: CardProduct }) {
  return <div className="labels">
    {p.is_new && <span className="lab new">New</span>}
    {p.is_bestseller && <span className="lab best">Bestseller</span>}
    {p.was && <span className="lab sale">−{Math.round((1 - p.effective / p.was) * 100)}%</span>}
  </div>;
}

export function ProductCard({ p }: { p: CardProduct }) {
  const { add, wish, toggleWish, currency } = useStore();
  const [open, setOpen] = useState(false);
  const color = p.colors[0]?.name;
  const v = (s: number) => p.variants.find(x => x.color === color && x.size === s);
  const soldOut = p.stock_total <= 0;
  return (
    <article className="card rv in">
      <div className="card-media">
        <Link className="im" href={`/products/${p.slug}`} aria-label={p.name}>
          {p.images[0] && <div className="pic a"><img src={img(p.images[0])} alt={p.name} loading="lazy" /></div>}
          {p.images[1] && <div className="pic b"><img src={img(p.images[1])} alt="" loading="lazy" /></div>}
        </Link>
        <Labels p={p} />
        {soldOut && <div className="oos"><span>Sold out</span></div>}
        <button className={'heart' + (wish.includes(p.slug) ? ' on' : '')} onClick={() => toggleWish(p.slug, p.name)} aria-label={`Save ${p.name} to wishlist`}><Icon n="heart" /></button>
        {!soldOut && <div className={'qa' + (open ? ' open' : '')} onMouseLeave={() => setOpen(false)}>
          <button className="qa-btn" onClick={() => setOpen(true)}>+ Quick Add</button>
          <div className="qa-sizes"><p>{color} · select EU size</p><div className="sz">
            {SIZES.map(s => { const x = v(s); return <button key={s} disabled={!x || x.stock <= 0} onClick={() => { add({ variant_id: x!.id, qty: 1, slug: p.slug, name: p.name, color, size: s, price: p.effective, image_id: p.images[0] }, false); setOpen(false); }}>{s}</button>; })}
          </div></div>
        </div>}
      </div>
      <div className="card-body">
        <div className="cat-t">{p.categories[0]?.name}</div>
        <h3><Link href={`/products/${p.slug}`}>{p.name}</Link></h3>
        <div className="price"><span className={'now' + (p.was ? ' red' : '')}>{money(p.effective, currency)}</span>{p.was && <s>{money(p.was, currency)}</s>}</div>
        <div className="swatches">{p.colors.map(c => <span key={c.name} className="sw" title={c.name} style={{ background: c.hex }} />)}<small>{p.colors.length} {p.colors.length === 1 ? 'colour' : 'colours'}</small></div>
      </div>
    </article>
  );
}

export function Grid({ products, className = 'grid' }: { products: CardProduct[]; className?: string }) {
  return <div className={className}>{products.map(p => <ProductCard key={p.slug} p={p} />)}</div>;
}
