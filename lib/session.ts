// Edge-safe session helpers (used by middleware and server code)
import { SignJWT, jwtVerify } from 'jose';

export const ADMIN_COOKIE = 'fn_admin';
export const CUSTOMER_COOKIE = 'fn_customer';
export const ADMIN_TTL = 60 * 60 * 8;          // 8 hours
export const CUSTOMER_TTL = 60 * 60 * 24 * 30;  // 30 days

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters');
  return new TextEncoder().encode(s);
}

export type SessionPayload = { sub: string; kind: 'admin' | 'customer'; role?: string; v: number };

export async function signSession(p: SessionPayload, ttl: number) {
  return new SignJWT({ ...p }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttl}s`).sign(key());
}
export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] }); return payload as any; }
  catch { return null; }
}
