import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/catalog';
import { toCard } from '@/lib/serialize';
// Card data for a list of product slugs (used by the wishlist)
export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get('slugs') || '').split(',').filter(Boolean).slice(0, 60);
  if (!slugs.length) return NextResponse.json({ items: [] });
  const all = await listProducts();
  return NextResponse.json({ items: all.filter(p => slugs.includes(p.slug)).map(toCard) });
}
