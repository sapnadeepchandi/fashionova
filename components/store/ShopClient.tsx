'use client';
import { useMemo, useState } from 'react';
import { Grid, type CardProduct } from './ProductCard';
import { money, useStore } from './StoreProvider';
import { Icon } from './Icons';

const SIZES = [35, 36, 37, 38, 39, 40, 41, 42];
type P = CardProduct & { created_at?: string };

export function ShopClient({ products, cats, lockCategory }: { products: P[]; cats: { name: string; slug: string }[]; lockCategory?: string }) {
  const { currency } = useStore();
  const top = Math.max(0, ...products.map(p => p.effective));
  const step = top > 20000 ? 1000 : top > 2000 ? 500 : 10;
  const maxPrice = Math.max(step * 10, Math.ceil(top / step) * step);
  const [cat, setCat] = useState('all');
  const [min, setMin] = useState(0); const [max, setMax] = useState(maxPrice);
  const [sizes, setSizes] = useState<number[]>([]); const [colors, setColors] = useState<string[]>([]);
  const [flags, setFlags] = useState({ isNew: false, best: false, sale: false, inStock: false });
  const [sort, setSort] = useState('featured'); const [open, setOpen] = useState(false);
  const allColors = useMemo(() => { const m = new Map<string, string>(); products.forEach(p => p.colors.forEach(c => m.set(c.name, c.hex))); return [...m]; }, [products]);
  const catsHere = cats.filter(c => products.some(p => p.categories.some(k => k.slug === c.slug)) && c.slug !== lockCategory);

  const list = useMemo(() => {
    let r = products.filter(p => {
      if (cat !== 'all' && !p.categories.some(k => k.slug === cat)) return false;
      if (p.effective < min || p.effective > max) return false;
      if (sizes.length && !sizes.some(s => p.variants.some(v => v.size === s && v.stock > 0))) return false;
      if (colors.length && !colors.some(c => p.colors.some(x => x.name === c))) return false;
      if (flags.isNew && !p.is_new) return false; if (flags.best && !p.is_bestseller) return false;
      if (flags.sale && !p.was) return false; if (flags.inStock && p.stock_total <= 0) return false;
      return true;
    });
    if (sort === 'low') r = [...r].sort((a, b) => a.effective - b.effective);
    if (sort === 'high') r = [...r].sort((a, b) => b.effective - a.effective);
    if (sort === 'new') r = [...r].sort((a, b) => Number(b.is_new) - Number(a.is_new));
    return r;
  }, [products, cat, min, max, sizes, colors, flags, sort]);

  const toggle = <T,>(arr: T[], v: T) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  const clear = () => { setCat('all'); setMin(0); setMax(maxPrice); setSizes([]); setColors([]); setFlags({ isNew: false, best: false, sale: false, inStock: false }); };
  const chips: [string, () => void][] = [];
  if (cat !== 'all') chips.push([cats.find(c => c.slug === cat)?.name || cat, () => setCat('all')]);
  if (min > 0 || max < maxPrice) chips.push([`${money(min, currency)} – ${money(max, currency)}`, () => { setMin(0); setMax(maxPrice); }]);
  sizes.forEach(s => chips.push([`EU ${s}`, () => setSizes(x => x.filter(y => y !== s))]));
  colors.forEach(c => chips.push([c, () => setColors(x => x.filter(y => y !== c))]));
  (Object.keys(flags) as (keyof typeof flags)[]).forEach(k => flags[k] && chips.push([{ isNew: 'New', best: 'Best sellers', sale: 'On sale', inStock: 'In stock' }[k], () => setFlags(f => ({ ...f, [k]: false }))]));

  return (
    <div className="wrap shop">
      <aside className={'filters' + (open ? ' on' : '')} aria-label="Filters">
        <div className="f-close" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ fontSize: 28 }}>Filters</h3><button className="x" onClick={() => setOpen(false)} aria-label="Close filters"><Icon n="x" /></button></div>
        {catsHere.length > 0 && <div className="f-block"><h6>Category</h6>
          {[{ name: 'All styles', slug: 'all' }, ...catsHere].map(c => <label className="opt" key={c.slug}><span className="l"><input type="radio" name="fcat" checked={cat === c.slug} onChange={() => setCat(c.slug)} /><span className="bx" />{c.name}</span>
            <small>{c.slug === 'all' ? products.length : products.filter(p => p.categories.some(k => k.slug === c.slug)).length}</small></label>)}
        </div>}
        <div className="f-block"><h6>Price</h6>
          <div className="range"><div className="track" /><div className="fill" style={{ left: (min / maxPrice * 100) + '%', right: (100 - max / maxPrice * 100) + '%' }} />
            <input type="range" min={0} max={maxPrice} step={step} value={min} onChange={e => setMin(Math.min(+e.target.value, max - step))} aria-label="Minimum price" />
            <input type="range" min={0} max={maxPrice} step={step} value={max} onChange={e => setMax(Math.max(+e.target.value, min + step))} aria-label="Maximum price" /></div>
          <div className="range-vals"><span>{money(min, currency)}</span><span>{money(max, currency)}</span></div>
        </div>
        <div className="f-block"><h6>Size (EU)</h6><div className="sizes-f">{SIZES.map(s => <button key={s} className={sizes.includes(s) ? 'on' : ''} onClick={() => setSizes(x => toggle(x, s))}>{s}</button>)}</div></div>
        <div className="f-block"><h6>Colour</h6><div className="colors-f">{allColors.map(([n, hex]) => <button key={n} title={n} aria-label={n} className={colors.includes(n) ? 'on' : ''} style={{ background: hex }} onClick={() => setColors(x => toggle(x, n))} />)}</div></div>
        <div className="f-block"><h6>Edit</h6>
          {([['isNew', 'New arrivals'], ['best', 'Best sellers'], ['sale', 'On sale'], ['inStock', 'In stock only']] as const).map(([k, t]) =>
            <label className="opt" key={k}><span className="l"><input type="checkbox" checked={flags[k]} onChange={e => setFlags(f => ({ ...f, [k]: e.target.checked }))} /><span className="bx" />{t}</span></label>)}
        </div>
        <div style={{ paddingTop: 22 }}><button className="btn btn-line btn-block" onClick={clear}>Clear all filters</button></div>
      </aside>
      <div>
        <div className="toolbar">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><button className="btn btn-line filter-toggle" style={{ height: 44, padding: '0 22px' }} onClick={() => setOpen(true)}>Filters</button><span className="count">{list.length} {list.length === 1 ? 'style' : 'styles'}</span></div>
          <select className="select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort by"><option value="featured">Sort: Featured</option><option value="new">Newest</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select>
        </div>
        {chips.length > 0 && <div className="chips" style={{ margin: '-10px 0 26px' }}>{chips.map(([t, f], i) => <button key={i} className="chip" onClick={f}>{t} <span aria-hidden>×</span></button>)}</div>}
        {list.length ? <Grid products={list} /> : <div className="empty"><h3>No pairs found</h3><p>Try removing a filter.</p><button className="btn btn-dark" onClick={clear}>Clear all filters</button></div>}
      </div>
      {open && <div className="backdrop on" onClick={() => setOpen(false)} />}
    </div>
  );
}
