import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { LoginForm } from '@/components/admin/LoginForm';
export const metadata = { title: 'Sign in' };
export default async function Login() {
  if (await getAdmin()) redirect('/admin');
  const [hero, store] = await Promise.all([getContent('hero'), getContent('store')]);
  return <div className="login">
    <div className="art" style={hero.image_id ? { backgroundImage: `url(/api/images/${hero.image_id})` } : {}}><div><span className="eyebrow" style={{ color: 'var(--gold-l)' }}>{store.name}</span><h2>Store management</h2></div></div>
    <div className="box"><span className="eyebrow">{store.name} · Admin</span><h1>Welcome back</h1><p>Sign in to manage products, orders and your website.</p><LoginForm /></div>
  </div>;
}
