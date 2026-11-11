'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminLogout } from '@/app/admin/actions';

const I: Record<string, string> = {
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z', products: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10', categories: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  inventory: 'M3 7h18M3 12h18M3 17h18M7 3v18', orders: 'M6 2h12l2 4v15H4V6zM4 6h16M9 11h6', customers: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6M17 11a3 3 0 1 0 0-6M22 20c-.6-2.8-2.3-4.4-4.5-5',
  content: 'M3 4h18v6H3zM3 14h8v6H3zM15 14h6v6h-6z', pages: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8', promotions: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01',
  messages: 'M4 4h16v12H8l-4 4z', settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  users: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21c1.3-3.6 4.4-5.5 8-5.5s6.7 1.9 8 5.5', account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5', store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6'
};
const NAV: [string, [string, string, string][]][] = [
  ['Overview', [['dashboard', '/admin', 'Dashboard']]],
  ['Catalogue', [['products', '/admin/products', 'Products'], ['categories', '/admin/categories', 'Categories'], ['inventory', '/admin/inventory', 'Inventory']]],
  ['Sales', [['orders', '/admin/orders', 'Orders'], ['customers', '/admin/customers', 'Customers'], ['promotions', '/admin/promotions', 'Promotions']]],
  ['Website', [['content', '/admin/homepage', 'Homepage'], ['pages', '/admin/content', 'Pages & Info'], ['messages', '/admin/messages', 'Messages']]],
  ['Admin', [['settings', '/admin/settings', 'Store Settings'], ['users', '/admin/users', 'Team & Access']]]
];
const Ico = ({ n }: { n: string }) => <svg viewBox="0 0 24 24"><path d={I[n]} /></svg>;

export function Shell({ admin, perms, counts, store, children }: { admin: any; perms: string[]; counts: Record<string, number>; store: string; children: React.ReactNode }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => href === '/admin' ? path === '/admin' : path.startsWith(href);
  return (
    <div className="ad">
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="brand"><b>{store.toUpperCase()}</b><small>Admin</small></div>
        <nav>{NAV.map(([g, items]) => { const vis = items.filter(([p]) => perms.includes(p)); if (!vis.length) return null;
          return <div key={g} style={{ display: 'contents' }}><div className="grp">{g}</div>{vis.map(([p, href, t]) => <Link key={href} href={href} className={active(href) ? 'on' : ''}><Ico n={p} />{t}{counts[p] ? <span className="cnt">{counts[p]}</span> : null}</Link>)}</div>; })}
          <div className="grp">You</div>
          <Link href="/admin/account" className={active('/admin/account') ? 'on' : ''}><Ico n="account" />My password</Link>
          <a href="/" target="_blank" rel="noopener"><Ico n="store" />View website ↗</a>
        </nav>
        <div className="me">{admin.name}<small>{admin.role} · {admin.email}</small><form action={adminLogout}><button type="submit">Sign out</button></form></div>
      </aside>
      <div className={'overlay' + (open ? ' open' : '')} onClick={() => setOpen(false)} />
      <div className="main">
        <div className="topbar"><button className="burger" onClick={() => setOpen(true)} aria-label="Open menu"><svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" /></svg></button>
          <div className="right">{counts.alerts ? <Link href="/admin/inventory?filter=low" className="pill low">⚠ {counts.alerts} stock {counts.alerts === 1 ? 'alert' : 'alerts'}</Link> : null}<a className="btn btn-line btn-sm" href="/" target="_blank" rel="noopener">View site</a></div></div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
