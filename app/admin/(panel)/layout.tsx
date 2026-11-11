import { redirect } from 'next/navigation';
import { getAdmin, can } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { Shell } from '@/components/admin/Shell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  const store = await getContent('store');
  const [c] = await sql`select
    (select count(*) from orders where status = 'pending')::int as pending,
    (select count(*) from contact_messages where not handled)::int as messages,
    (select count(*) from product_variants v join products p on p.id = v.product_id where p.active and v.stock <= ${Number(store.low_stock_threshold)})::int as alerts`;
  const perms = ['dashboard', 'products', 'categories', 'inventory', 'orders', 'customers', 'content', 'pages', 'promotions', 'messages', 'settings', 'users'].filter(p => can(admin.role, p));
  return <Shell admin={admin} perms={perms} store={store.name} counts={{ orders: c.pending, messages: c.messages, inventory: c.alerts, alerts: c.alerts }}>{children}</Shell>;
}
