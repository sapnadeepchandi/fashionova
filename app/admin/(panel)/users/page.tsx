import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { EditUserForm, NewUserForm } from '@/components/admin/UserForms';
import { createUser, updateUser } from '@/app/admin/actions';
export const metadata = { title: 'Team & access' };
export default async function Users() {
  const me = await requireAdminPage('users');
  const users = await sql`select id, name, email, role, active, last_login_at from admin_users order by role, name`;
  return (<>
    <PageHead title="Team & access" sub="Who can sign in to the admin, and what they can do." />
    <div className="cols">
      <div className="panel"><div className="tbl-wrap"><table className="t"><thead><tr><th>Person</th><th>Last sign-in</th><th>Access</th></tr></thead>
        <tbody>{users.map((u: any) => <tr key={u.id}><td><b style={{ fontWeight: 500 }}>{u.name}</b>{u.id === me.id && <span className="muted"> (you)</span>}<div className="muted" style={{ fontSize: 12.5 }}>{u.email}</div></td>
          <td className="muted nowrap">{u.last_login_at ? fmtDate(u.last_login_at, true) : 'Never'}</td><td><EditUserForm action={updateUser.bind(null, u.id)} u={u} /></td></tr>)}</tbody></table></div>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}><b>Owner</b>: everything. <b>Manager</b>: products, categories, stock, orders, customers, website content and promotions. <b>Staff</b>: orders, customers, stock and messages.</p></div>
      <div className="panel"><h2>Add a team member</h2><p className="sub">They sign in at /admin/login.</p><NewUserForm action={createUser} /></div>
    </div>
  </>);
}
