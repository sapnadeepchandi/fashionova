import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { listCategories } from '@/lib/catalog';
import { PageHead } from '@/components/admin/bits';
import { CampaignForm } from '@/components/admin/PromoForms';
import { updateCampaign } from '@/app/admin/actions';
export default async function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('promotions');
  const { id } = await params; if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await sql`select * from campaigns where id = ${id}`; if (!c) notFound();
  return <><PageHead title={c.name}><Link className="btn btn-line" href="/admin/promotions">Back</Link></PageHead><div className="panel" style={{ maxWidth: 760 }}><CampaignForm action={updateCampaign.bind(null, c.id)} c={c} cats={await listCategories(false)} /></div></>;
}
