'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { img, money, useStore } from './StoreProvider';
import { Icon } from './Icons';

type NavCat = { name: string; slug: string };

export function Announcements({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (items.length < 2) return; const t = setInterval(() => setI(x => (x + 1) % items.length), 4200); return () => clearInterval(t); }, [items.length]);
  return <div className="announce" aria-live="polite">{items.map((t, k) => <span key={k} className={k === i ? 'on' : ''}>{t}</span>)}</div>;
}

export function Header({ cats, store }: { cats: NavCat[]; store: any }) {
  const { cartCount, wish, open, ready } = useStore();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(scrollY > 10); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  const links = [{ href: '/', t: 'Home' }, { href: '/collections/new-arrivals', t: 'New Arrivals' }, { href: '/collections/all', t: 'Shop All' },
    ...cats.map(c => ({ href: `/collections/${c.slug}`, t: c.name })), { href: '/collections/sale', t: 'Sale', sale: true }];
  return (
    <header className={'top' + (scrolled ? ' scrolled' : '')} id="top">
      <div className="wrap nav">
        <div className="nav-left">
          <button className="ico burger" aria-label="Open menu" onClick={() => open('menu')}><Icon n="menu" /></button>
          <Link href="/pages/contact" className="care">Client Care</Link><span className="care-sep" />
          <Link href="/pages/shipping" className="care">Free delivery over {money(store.free_shipping_threshold, store.currency)}</Link>
        </div>
        <Link href="/" className="logo" aria-label={`${store.name} home`}><span className="word">{store.name.toUpperCase()}</span><span className="tag">{store.tagline}</span></Link>
        <div className="icons">
          <button className="ico" aria-label="Search" onClick={() => open('search')}><Icon n="search" /></button>
          <Link className="ico hide-sm" href="/account" aria-label="Account"><Icon n="user" /></Link>
          <Link className="ico" href="/wishlist" aria-label="Wishlist"><Icon n="heart" /><span className={'badge-n' + (ready && wish.length ? ' show' : '')}>{wish.length}</span></Link>
          <button className="ico" aria-label="Shopping bag" onClick={() => open('cart')}><Icon n="bag" /><span className={'badge-n' + (ready && cartCount ? ' show' : '')}>{cartCount}</span></button>
        </div>
      </div>
      <nav className="menu" aria-label="Primary">
        {links.map(l => <Link key={l.href} href={l.href} className={(path === l.href ? 'active ' : '') + ((l as any).sale ? 'sale' : '')}>{l.t}</Link>)}
      </nav>
    </header>
  );
}

export function Overlays({ cats, store }: { cats: NavCat[]; store: any }) {
  const { panel, close, toastState } = useStore();
  const path = usePathname();
  useEffect(() => { close(); }, [path]); // eslint-disable-line
  return (<>
    <div className={'backdrop' + (panel ? ' on' : '')} onClick={close} />
    <CartDrawer />
    <MobileNav cats={cats} store={store} />
    <SearchOverlay />
    <div className={'toast' + (toastState ? ' on' : '')} role="status">
      {toastState && <><i>✓</i><span>{toastState.msg}</span>
        {toastState.action && (toastState.action.href ? <Link href={toastState.action.href}>{toastState.action.label}</Link>
          : <a href="#" onClick={e => { e.preventDefault(); toastState.action!.onClick?.(); }}>{toastState.action.label}</a>)}</>}
    </div>
  </>);
}

function CartDrawer() {
  const { panel, close, cart, setQty, remove, replaceCart, currency, freeShip, toast } = useStore();
  const [live, setLive] = useState<any>(null);
  const on = panel === 'cart';
  // refresh live prices + stock whenever the bag opens or changes
  useEffect(() => {
    if (!on || !cart.length) { setLive(null); return; }
    const ctl = new AbortController();
    fetch('/api/cart', { method: 'POST', body: JSON.stringify({ lines: cart }), signal: ctl.signal, headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json()).then(d => {
        if (!d.items) return;
        setLive(d);
        const known = new Set(d.items.map((i: any) => i.variant_id));
        const changed = cart.some(l => !known.has(l.variant_id) || d.items.find((i: any) => i.variant_id === l.variant_id)?.unit_price !== l.price);
        if (changed) { replaceCart(cart.filter(l => known.has(l.variant_id)).map(l => ({ ...l, price: d.items.find((i: any) => i.variant_id === l.variant_id).unit_price }))); }
        if (d.problems?.length) toast(d.problems[0]);
      }).catch(() => {});
    return () => ctl.abort();
  }, [on, JSON.stringify(cart.map(l => [l.variant_id, l.qty]))]); // eslint-disable-line
  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const left = Math.max(0, freeShip - subtotal);
  return (
    <aside className={'drawer' + (on ? ' on' : '')} aria-label="Shopping bag" aria-hidden={!on}>
      <div className="dr-head"><h3>Your Bag {cart.length > 0 && <small>({cart.reduce((a, l) => a + l.qty, 0)})</small>}</h3><button className="x" onClick={close} aria-label="Close bag"><Icon n="x" /></button></div>
      {!cart.length ? (
        <div className="dr-body"><div className="dr-empty"><Icon n="bag" /><h4>Your bag is empty</h4><p>Let&apos;s find your perfect pair.</p><Link href="/collections/new-arrivals" className="btn btn-dark">Shop New Arrivals</Link></div></div>
      ) : (<>
        <div className="ship-bar">{left > 0 ? <>You&apos;re <b>{money(Math.round(left * 100) / 100, currency)}</b> away from complimentary delivery</> : <>✦ You&apos;ve unlocked <b>complimentary delivery</b></>}
          <div className="bar"><i style={{ width: Math.min(100, subtotal / freeShip * 100) + '%' }} /></div></div>
        <div className="dr-body">{cart.map(l => {
          const li = live?.items?.find((i: any) => i.variant_id === l.variant_id);
          return (
            <div className="line" key={l.variant_id}>
              <Link className="th" href={`/products/${l.slug}`}>{l.image_id && <img src={img(l.image_id)} alt={l.name} />}</Link>
              <div>
                <div className="row" style={{ alignItems: 'flex-start' }}><h4><Link href={`/products/${l.slug}`}>{l.name}</Link></h4><b style={{ fontWeight: 500 }}>{money(l.price * l.qty, currency)}</b></div>
                <div className="meta">{l.color} · EU {l.size}{li && li.stock < l.qty && <span style={{ color: '#9B4A44' }}> · {li.stock ? `only ${li.stock} left` : 'sold out'}</span>}</div>
                <div className="row"><div className="qty sm"><button onClick={() => setQty(l.variant_id, l.qty - 1)} aria-label="Decrease">−</button><span>{l.qty}</span><button onClick={() => setQty(l.variant_id, l.qty + 1)} aria-label="Increase">+</button></div>
                  <button className="rm" onClick={() => { remove(l.variant_id); toast(`${l.name} removed from your bag`); }}>Remove</button></div>
              </div>
            </div>);
        })}</div>
        <div className="dr-foot">
          <div className="tot"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
          <small>Delivery and promo codes are applied at checkout.</small>
          <Link href="/checkout" className="btn btn-dark btn-block">Secure Checkout</Link>
          <button className="btn btn-block" onClick={close} style={{ marginTop: 6, height: 44 }}>Continue Shopping</button>
        </div>
      </>)}
    </aside>
  );
}

function MobileNav({ cats, store }: { cats: NavCat[]; store: any }) {
  const { panel, close } = useStore();
  const on = panel === 'menu';
  return (
    <aside className={'drawer left' + (on ? ' on' : '')} aria-label="Menu" aria-hidden={!on}>
      <div className="dr-head"><Link href="/" className="logo" style={{ alignItems: 'flex-start' }}><span className="word" style={{ fontSize: 22, marginRight: 0 }}>{store.name.toUpperCase()}</span><span className="tag" style={{ marginRight: 0 }}>{store.tagline}</span></Link><button className="x" onClick={close} aria-label="Close menu"><Icon n="x" /></button></div>
      <nav className="mnav">
        <Link href="/">Home <span>›</span></Link><Link href="/collections/new-arrivals">New Arrivals <span>›</span></Link><Link href="/collections/all">Shop All <span>›</span></Link>
        {cats.map(c => <Link key={c.slug} href={`/collections/${c.slug}`}>{c.name} <span>›</span></Link>)}
        <Link href="/collections/sale" className="sale">Sale <span>›</span></Link>
        <div className="sm-links"><Link href="/account">My Account</Link><Link href="/wishlist">Wishlist</Link><Link href="/pages/contact">Contact Us</Link><Link href="/pages/shipping">Shipping &amp; Returns</Link></div>
      </nav>
    </aside>
  );
}

function SearchOverlay() {
  const { panel, close, currency } = useStore();
  const on = panel === 'search';
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => { if (on) setTimeout(() => ref.current?.focus(), 300); }, [on]);
  useEffect(() => {
    if (!on) return;
    const ctl = new AbortController();
    const t = setTimeout(() => fetch('/api/search?q=' + encodeURIComponent(q), { signal: ctl.signal }).then(r => r.json()).then(d => setRes(d.items || [])).catch(() => {}), 160);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, on]);
  return (
    <div className={'search' + (on ? ' on' : '')} aria-hidden={!on}>
      <div className="wrap">
        <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) { close(); router.push('/search?q=' + encodeURIComponent(q.trim())); } }}>
          <Icon n="search" />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} type="search" placeholder="Search heels, sandals, colours…" autoComplete="off" aria-label="Search products" />
          <button type="button" className="x" onClick={close} aria-label="Close search"><Icon n="x" /></button>
        </form>
        <div className="s-sugg"><span>Popular</span>{['Pump', 'Gold', 'Sandal', 'Sneaker', 'Black'].map(s => <button key={s} className="tab" onClick={() => setQ(s)}>{s}</button>)}</div>
        <div className="s-res">
          {!q && res.length > 0 && <p className="eyebrow" style={{ gridColumn: '1/-1' }}>New this week</p>}
          {q && !res.length && <p style={{ color: 'var(--muted)', gridColumn: '1/-1' }}>No results for “{q}”. Try “heels”, “gold” or “sandal”.</p>}
          {res.map(p => <Link key={p.slug} className="s-item" href={`/products/${p.slug}`}><div className="th">{p.image && <img src={img(p.image)} alt="" />}</div><div><h5>{p.name}</h5><small>{p.category} · {money(p.price, currency)}</small></div></Link>)}
          {q && res.length >= 8 && <p style={{ gridColumn: '1/-1' }}><Link className="link-u" href={'/search?q=' + encodeURIComponent(q)} onClick={close}>See all results</Link></p>}
        </div>
      </div>
    </div>
  );
}
