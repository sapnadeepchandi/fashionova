import 'server-only';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from './db';
import { ADMIN_COOKIE, ADMIN_TTL, CUSTOMER_COOKIE, CUSTOMER_TTL, signSession, verifySession } from './session';

export type Role = 'owner' | 'manager' | 'staff';
export type Admin = { id: string; email: string; name: string; role: Role };

// What each role may do
const PERMS: Record<Role, string[]> = {
  owner:   ['dashboard', 'products', 'categories', 'inventory', 'orders', 'customers', 'content', 'pages', 'promotions', 'messages', 'settings', 'users'],
  manager: ['dashboard', 'products', 'categories', 'inventory', 'orders', 'customers', 'content', 'pages', 'promotions', 'messages'],
  staff:   ['dashboard', 'inventory', 'orders', 'customers', 'messages']
};
export const can = (role: Role, area: string) => PERMS[role]?.includes(area);

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

const secure = process.env.NODE_ENV === 'production';

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

/** Throttle: max 5 failures per identifier and 20 per IP within 15 minutes */
export async function isThrottled(scope: string, email: string, ip: string) {
  const [r] = await sql`
    select
      count(*) filter (where identifier = ${email}) as by_email,
      count(*) filter (where identifier = ${ip}) as by_ip
    from login_attempts
    where scope = ${scope} and success = false and created_at > now() - interval '15 minutes'
      and identifier in (${email}, ${ip})`;
  return Number(r.by_email) >= 5 || Number(r.by_ip) >= 20;
}
export async function recordAttempt(scope: string, email: string, ip: string, success: boolean) {
  await sql`insert into login_attempts (scope, identifier, success) values (${scope}, ${email}, ${success}), (${scope}, ${ip}, ${success})`;
  if (success) await sql`delete from login_attempts where scope = ${scope} and identifier = ${email} and success = false`;
}

// ---------- admin ----------
export async function startAdminSession(u: { id: string; role: string; session_version: number }) {
  const token = await signSession({ sub: u.id, kind: 'admin', role: u.role, v: u.session_version }, ADMIN_TTL);
  (await cookies()).set(ADMIN_COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: ADMIN_TTL });
}
export async function endAdminSession() { (await cookies()).delete(ADMIN_COOKIE); }

export async function getAdmin(): Promise<Admin | null> {
  const s = await verifySession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!s || s.kind !== 'admin') return null;
  const [u] = await sql`select id, email, name, role, active, session_version from admin_users where id = ${s.sub}`;
  if (!u || !u.active || u.session_version !== s.v) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

/** Use in admin pages: redirects to login when not signed in or not allowed */
export async function requireAdminPage(area: string) {
  const a = await getAdmin();
  if (!a) redirect('/admin/login');
  if (!can(a.role, area)) redirect('/admin?denied=1');
  return a;
}

export class AuthError extends Error {}
/** Use in server actions / API routes: throws when not allowed */
export async function requireAdmin(area: string) {
  const a = await getAdmin();
  if (!a) throw new AuthError('Your session has expired. Please sign in again.');
  if (!can(a.role, area)) throw new AuthError('You do not have permission to do that.');
  return a;
}

// ---------- customers ----------
export async function startCustomerSession(c: { id: string; session_version: number }) {
  const token = await signSession({ sub: c.id, kind: 'customer', v: c.session_version }, CUSTOMER_TTL);
  (await cookies()).set(CUSTOMER_COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: CUSTOMER_TTL });
}
export async function endCustomerSession() { (await cookies()).delete(CUSTOMER_COOKIE); }
export async function getCustomer() {
  const s = await verifySession((await cookies()).get(CUSTOMER_COOKIE)?.value);
  if (!s || s.kind !== 'customer') return null;
  const [c] = await sql`select id, email, name, phone, address_line1, address_line2, city, postcode, country, session_version from customers where id = ${s.sub} and password_hash is not null`;
  if (!c || c.session_version !== s.v) return null;
  return c;
}
