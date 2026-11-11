import { NextResponse } from 'next/server';
import { priceCart } from '@/lib/orders';

// Returns live prices and stock for the items in a shopper's bag
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lines = Array.isArray(body?.lines) ? body.lines.slice(0, 50).map((l: any) => ({ variant_id: String(l.variant_id), qty: Number(l.qty) })) : [];
    const r = await priceCart(lines);
    return NextResponse.json({ subtotal: r.subtotal, problems: r.problems, items: r.items.map(i => ({ variant_id: i.variant_id, slug: i.slug, name: i.name, color: i.color, size: i.size, stock: i.stock, qty: i.qty, unit_price: i.unit_price, was: i.was, image_id: i.image_id })) });
  } catch { return NextResponse.json({ error: 'Could not load bag' }, { status: 400 }); }
}
