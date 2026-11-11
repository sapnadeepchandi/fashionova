import { requireAdminPage } from '@/lib/auth';
import { PageHead } from '@/components/admin/bits';
import { ActionForm, Submit, Text } from '@/components/admin/ui';
import { changeOwnPassword } from '@/app/admin/actions';
export const metadata = { title: 'My password' };
export default async function Account() {
  const a = await requireAdminPage('dashboard');
  return (<><PageHead title="My password" sub={`${a.name} · ${a.email} · ${a.role}`} />
    <div className="panel" style={{ maxWidth: 560 }}><ActionForm action={changeOwnPassword} reset><div className="form-grid">
      <Text name="current" label="Current password" type="password" full /><Text name="next" label="New password" type="password" full hint="At least 10 characters" /><Text name="confirm" label="Confirm new password" type="password" full />
      <div className="form-actions full"><Submit>Change password</Submit></div></div></ActionForm></div></>);
}
