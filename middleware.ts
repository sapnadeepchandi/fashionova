import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from './lib/session';

// First line of defence for the admin area. Every page, action and API route
// re-checks the session against the database as well.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
  const ok = s && s.kind === 'admin';
  if (ok) return NextResponse.next();
  if (pathname.startsWith('/api/admin')) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const url = req.nextUrl.clone(); url.pathname = '/admin/login'; url.search = '';
  return NextResponse.redirect(url);
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
