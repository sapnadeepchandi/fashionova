import { sql } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Not found', { status: 404 });
  const [img] = await sql`select mime, data from images where id = ${id}`;
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(img.data, {
    headers: {
      'Content-Type': img.mime,
      // images are immutable: a changed picture is a new id
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'"
    }
  });
}
