import './admin.css';
import { ToastProvider } from '@/components/admin/ui';
export const metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: React.ReactNode }) { return <ToastProvider>{children}</ToastProvider>; }
