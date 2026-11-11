import { NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth';
import { saveImage } from '@/lib/images';

export async function POST(req: Request) {
  try {
    // same-origin check (cookie is SameSite=Lax; this blocks cross-site form posts too)
    const origin = req.headers.get('origin'); const host = req.headers.get('host');
    if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
    await requireAdmin('content');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    const id = await saveImage(file, String(form.get('alt') || ''));
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed.' }, { status: e instanceof AuthError ? 401 : 400 });
  }
}
