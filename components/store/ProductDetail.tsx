'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { img, money, useStore } from './StoreProvider';
import { Icon } from './Icons';
import { Labels, type CardProduct } from './ProductCard';

const SIZES = [35, 36, 37, 38, 39, 40, 41, 42];

export function ProductDetail({ p, extra }: { p: CardProduct & { description: string; heel: string; material: string; details: string; images: string[] }; extra: { store: any; shipping: string; returns: string } }) {
  const { add, wish, toggleWish, currency } = useStore();
  const router = useRouter();
  const [color, setColor] = useState(p.colors.find(c => p.variants.some(v => v.color === c.name && v.stock > 0))?.name || p.colors[0]?.name);
  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [err, setErr] = useState('');
  const [openAcc, setOpenAcc] = useState(0);
  const sizesRef = useRef<HTMLDivElement>(null);
  const variant = (s: number) => p.variants.find(v => v.color === color && v.size === s);
  const sel = size ? variant(size) : null;
  const imgs = p.images.length ? p.images : [];
  const soldOutSizes = SIZES.filter(s => !variant(s) || variant(s)!.stock <= 0);

  function go(buyNow: boolean) {
    if (!sel) { setErr('Please select your size to continue.'); sizesRef.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
    if (qty > sel.stock) { setErr(`Only ${sel.stock} available in this size.`); return; }
    add({ variant_id: sel.id, qty, slug: p.slug, name: p.name, color: color!, size: size!, price: p.effective, image_id: p.images[0] }, !buyNow);
    if (buyNow) router.push('/checkout');
  }
  const accs = [
    ['Details & Fit', <ul key="d">{p.details.split('\n').filter(Boolean).map((l, k) => <li key={k}>{l}</li>)}</ul>],
    ['Delivery & Returns', <div key="r"><p>{extra.shipping}</p><p style={{ marginTop: 8 }}>{extra.returns}</p></div>],
    ['Care Guide', <p key="c">Store in the dust bags provided, away from direct sunlight. Wipe leather with a soft, dry cloth; use a suede brush for suede and velvet.</p>]
  ] as const;

  return (
    <div className="pdp">
      <div className="gallery">
        <div className="thumbs">{imgs.map((id, k) => <button key={id} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`View image ${k + 1}`}><img src={img(id)} alt="" /></button>)}</div>
        <div className={'main-img' + (zoom ? ' zoom' : '')} onClick={() => setZoom(z => !z)}>
          <div className="stage">{imgs[i] && <img src={img(imgs[i])} alt={p.name} />}</div>
          <Labels p={p} />
          {imgs.length > 1 && <>
            <button className="nav-a l" onClick={e => { e.stopPropagation(); setI((i - 1 + imgs.length) % imgs.length); }} aria-label="Previous image"><Icon n="left" /></button>
            <button className="nav-a r" onClick={e => { e.stopPropagation(); setI((i + 1) % imgs.length); }} aria-label="Next image"><Icon n="right" /></button></>}
          <span className="zoomed-hint">{zoom ? 'Click to close' : 'Click to zoom'}</span>
        </div>
      </div>
      <div className="pdp-info">
        <div className="cat-t">{p.categories[0]?.name}{p.heel && ` · ${p.heel}`}</div>
        <h1>{p.name}</h1>
        <div className="price"><span className={'now' + (p.was ? ' red' : '')}>{money(p.effective, currency)}</span>{p.was && <s>{money(p.was, currency)}</s>}</div>
        <div className="klarna">Free delivery on orders over {money(extra.store.free_shipping_threshold, currency)}</div>
        <p className="desc">{p.description}</p>
        <div className="opt-label">Colour <span>{color}</span></div>
        <div className="pdp-colors">{p.colors.map(c => <button key={c.name} className={c.name === color ? 'on' : ''} aria-label={c.name} title={c.name} style={{ background: c.hex }} onClick={() => { setColor(c.name); setSize(null); setErr(''); }} />)}</div>
        <div className="opt-label">Size (EU) <a href="/faqs" style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 400, fontSize: 13, textDecoration: 'underline', color: 'var(--muted)' }}>Size guide</a></div>
        <div className="pdp-sizes" ref={sizesRef}>{SIZES.map(s => { const v = variant(s); const out = !v || v.stock <= 0;
          return <button key={s} className={size === s ? 'on' : ''} disabled={out} title={out ? 'Sold out' : ''} onClick={() => { setSize(s); setErr(''); setQty(1); }}>{s}</button>; })}</div>
        <div className={'size-note' + (err ? ' err' : '')}>{err || (sel ? (sel.stock <= 3 ? `Only ${sel.stock} left in EU ${size} — order soon.` : `EU ${size} selected — in stock, ready to ship.`) : soldOutSizes.length === SIZES.length ? 'This colour is currently sold out.' : soldOutSizes.length ? `EU ${soldOutSizes.join(', ')} currently sold out in ${color}.` : 'Fits true to size. If between sizes, choose the larger.')}</div>
        <div className="buy-row">
          <div className="qty"><button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><span>{qty}</span><button onClick={() => setQty(q => Math.min(sel ? Math.min(10, sel.stock) : 10, q + 1))} aria-label="Increase quantity">+</button></div>
          <button className="btn btn-dark" onClick={() => go(false)}>Add to Bag — {money(p.effective * qty, currency)}</button>
        </div>
        <button className="btn btn-gold btn-block" onClick={() => go(true)}>Buy Now</button>
        <button className={'pdp-wish' + (wish.includes(p.slug) ? ' on' : '')} onClick={() => toggleWish(p.slug, p.name)}><Icon n="heart" /><span>{wish.includes(p.slug) ? 'Saved to wishlist' : 'Add to wishlist'}</span></button>
        <div className="perks"><div><Icon n="truck" />Free delivery over {money(extra.store.free_shipping_threshold, currency)}</div><div><Icon n="ret" />30-day free returns</div><div><Icon n="box" />Signature gift box</div></div>
        {accs.map(([t, body], k) => <div key={t} className={'acc' + (openAcc === k ? ' open' : '')}><button className="h" onClick={() => setOpenAcc(openAcc === k ? -1 : k)}>{t}<i /></button><div className="b"><div><div className="bi">{body}</div></div></div></div>)}
      </div>
    </div>
  );
}
