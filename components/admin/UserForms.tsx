'use client';
import { ActionForm, Sel, Submit, Text, type Res } from './ui';
export function NewUserForm({ action }: { action: (p: Res | null, fd: FormData) => Promise<Res> }) {
  return <ActionForm action={action} reset><div className="form-grid"><Text name="name" label="Name" /><Text name="email" label="Email" type="email" />
    <Sel name="role" label="Role" defaultValue="staff" options={[['staff', 'Staff — orders, customers, stock'], ['manager', 'Manager — everything except settings & team'], ['owner', 'Owner — full access']]} />
    <Text name="password" label="Temporary password" type="password" hint="At least 10 characters. Ask them to change it after signing in." />
    <div className="form-actions full"><Submit>Add team member</Submit></div></div></ActionForm>;
}
export function EditUserForm({ action, u }: { action: (p: Res | null, fd: FormData) => Promise<Res>; u: any }) {
  return <ActionForm action={action}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    <select className="inp" name="role" defaultValue={u.role} style={{ width: 130, height: 36 }} aria-label="Role"><option value="owner">Owner</option><option value="manager">Manager</option><option value="staff">Staff</option></select>
    <input className="inp" type="password" name="password" placeholder="New password (optional)" style={{ width: 210, height: 36 }} autoComplete="new-password" />
    <label className="check" style={{ fontSize: 13 }}><input type="checkbox" name="active" value="1" defaultChecked={u.active} />Active</label>
    <Submit className="btn btn-line btn-sm">Save</Submit></div></ActionForm>;
}
