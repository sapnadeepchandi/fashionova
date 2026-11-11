import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/catalog';

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || '').slice(0, 60);
  const items = q.trim() ? await listProducts({ q, limit: 8 }) : await listProducts({ flag: 'is_new', limit: 4 });
  return NextResponse.json({ items: items.map(p => ({ slug: p.slug, name: p.name, price: p.effective, image: p.images[0], category: p.categories[0]?.name || '' })) });
}
