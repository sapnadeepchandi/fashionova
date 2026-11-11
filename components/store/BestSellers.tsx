'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Grid, type CardProduct } from './ProductCard';

export function BestSellers({ eyebrow, title, products }: { eyebrow: string; title: string; products: CardProduct[] }) {
  const tabs = ['All', ...Array.from(new Set(products.map(p => p.categories[0]?.name).filter(Boolean)))];
  const [t, setT] = useState('All');
  const list = products.filter(p => t === 'All' || p.categories[0]?.name === t).slice(0, 8);
  return (<>
    <div className="sec-head rv">
      <div><span className="eyebrow">{eyebrow}</span><h2 className="h-sec" style={{ marginTop: 10 }}>{title}</h2></div>
      {tabs.length > 2 && <div className="tabs">{tabs.map(x => <button key={x} className={'tab' + (x === t ? ' on' : '')} onClick={() => setT(x)}>{x}</button>)}</div>}
    </div>
    <Grid products={list} />
    <div className="center" style={{ marginTop: 50 }}><Link href="/collections/best-sellers" className="btn btn-line">View All Best Sellers</Link></div>
  </>);
}
