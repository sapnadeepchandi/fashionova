import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { PageHead } from '@/components/admin/bits';
import { CodeForm } from '@/components/admin/PromoForms';
import { updateCode } from '@/app/admin/actions';
export default async function EditCode({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('promotions');
  const { id } = await params; if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await sql`select * from discount_codes where id = ${id}`; if (!c) notFound();
  return <><PageHead title={`Code ${c.code}`} sub={`Used ${c.used_count} times`}><Link className="btn btn-line" href="/admin/promotions">Back</Link></PageHead><div className="panel" style={{ maxWidth: 760 }}><CodeForm action={updateCode.bind(null, c.id)} c={c} /></div></>;
}
