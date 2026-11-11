'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type CartLine = { variant_id: string; qty: number; slug: string; name: string; color: string; size: number; price: number; image_id?: string | null };
type Panel = null | 'cart' | 'search' | 'menu' | 'filters';
type Toast = { msg: string; action?: { label: string; href?: string; onClick?: () => void } } | null;

type Ctx = {
  cart: CartLine[]; cartCount: number; ready: boolean; currency: string; freeShip: number;
  add: (l: CartLine, open?: boolean) => void; setQty: (variant_id: string, qty: number) => void; remove: (variant_id: string) => void; clear: () => void;
  replaceCart: (lines: CartLine[]) => void;
  wish: string[]; toggleWish: (slug: string, name?: string) => void;
  panel: Panel; open: (p: Panel) => void; close: () => void;
  toast: (msg: string, action?: Toast['action']) => void; toastState: Toast;
};
const C = createContext<Ctx>(null as any);
export const useStore = () => useContext(C);

function load<T>(k: string, d: T): T { try { const v = localStorage.getItem('fn_' + k); return v ? JSON.parse(v) : d; } catch { return d; } }
function save(k: string, v: any) { try { localStorage.setItem('fn_' + k, JSON.stringify(v)); } catch {} }

export function StoreProvider({ children, currency, freeShip }: { children: React.ReactNode; currency: string; freeShip: number }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [toastState, setToast] = useState<Toast>(null);
  const timer = useRef<any>(null);

  useEffect(() => { setCart(load('cart', [])); setWish(load('wish', [])); setReady(true); }, []);
  useEffect(() => { if (ready) save('cart', cart); }, [cart, ready]);
  useEffect(() => { if (ready) save('wish', wish); }, [wish, ready]);
  useEffect(() => { document.body.style.overflow = panel ? 'hidden' : ''; }, [panel]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);

  const toast = useCallback((msg: string, action?: Toast['action']) => {
    setToast({ msg, action }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 3600);
  }, []);
  const add = useCallback((l: CartLine, open = true) => {
    setCart(c => { const ex = c.find(x => x.variant_id === l.variant_id); return ex ? c.map(x => x === ex ? { ...x, qty: Math.min(10, x.qty + l.qty) } : x) : [...c, l]; });
    if (open) setPanel('cart'); else toast(`${l.name} (EU ${l.size}) added to your bag`, { label: 'View bag', onClick: () => setPanel('cart') });
  }, [toast]);
  const setQty = (id: string, q: number) => setCart(c => c.map(x => x.variant_id === id ? { ...x, qty: Math.max(1, Math.min(10, q)) } : x));
  const remove = (id: string) => setCart(c => c.filter(x => x.variant_id !== id));
  const toggleWish = (slug: string, name?: string) => setWish(w => {
    if (w.includes(slug)) { toast('Removed from your wishlist'); return w.filter(x => x !== slug); }
    toast(`${name || 'Style'} saved to your wishlist`, { label: 'View', href: '/wishlist' }); return [...w, slug];
  });

  const value: Ctx = {
    cart, cartCount: cart.reduce((a, l) => a + l.qty, 0), ready, currency, freeShip, add, setQty, remove,
    clear: () => setCart([]), replaceCart: setCart, wish, toggleWish,
    panel, open: setPanel, close: () => setPanel(null), toast, toastState
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function money(n: number, cur = 'Rs.') { const v = Number(n || 0); const num = v.toLocaleString('en-GB', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); return cur + (/[A-Za-z.]$/.test(cur) ? ' ' : '') + num; }
export const img = (id?: string | null) => (id ? `/api/images/${id}` : '');
