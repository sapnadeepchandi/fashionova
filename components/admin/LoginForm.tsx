'use client';
import { PendingCtx, useAction } from '@/lib/useAction';
import { adminLogin } from '@/app/admin/actions';
import { Submit } from './ui';
export function LoginForm() {
  const [state, onSubmit, pending] = useAction(adminLogin);
  return <PendingCtx.Provider value={pending}><form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
    {state && !state.ok && <div className="alert err">{state.message}</div>}
    <div className="f"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
    <div className="f"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
    <Submit className="btn btn-dark">Sign in</Submit>
  </form></PendingCtx.Provider>;
}
