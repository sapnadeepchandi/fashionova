import 'server-only';
import { sql } from './db';

export type Variant = { id: string; color: string; size: number; stock: number; sku?: string };
export type Product = {
  id: string; name: string; slug: string; description: string; details: string;
  price: number; sale_price: number | null; effective: number; was: number | null;
  heel: string; material: string; is_new: boolean; is_bestseller: boolean; is_featured: boolean; active: boolean; sort_order: number;
  images: string[]; colors: { name: string; hex: string }[]; variants: Variant[];
  categories: { id: string; name: string; slug: string }[]; stock_total: number; created_at: string;
};

export async function activeCampaigns(db: any = sql) {
  return db`select id, name, percent_off, category_id, announcement from campaigns where active and now() between starts_at and ends_at order by percent_off desc`;
}

export function applyPricing(p: any, campaigns: any[]): Product {
  let eff = p.sale_price != null && p.sale_price < p.price ? Number(p.sale_price) : Number(p.price);
  for (const c of campaigns) {
    if (c.category_id && !p.categories.some((x: any) => x.id === c.category_id)) continue;
    const v = Math.round(Number(p.price) * (1 - Number(c.percent_off) / 100) * 100) / 100;
    if (v < eff) eff = v;
  }
  return { ...p, price: Number(p.price), effective: eff, was: eff < Number(p.price) ? Number(p.price) : null };
}

type Opts = { includeInactive?: boolean; ids?: string[]; slug?: string; category?: string; flag?: 'is_new' | 'is_bestseller' | 'is_featured' | 'sale'; q?: string; limit?: number };

export async function listProducts(o: Opts = {}): Promise<Product[]> {
  const q = o.q?.trim() ? `%${o.q.trim().replace(/[%_]/g, '')}%` : null;
  const rows = await sql`
    select p.*,
      coalesce((select json_agg(pi.image_id order by pi.sort_order) from product_images pi where pi.product_id = p.id), '[]') as images,
      coalesce((select json_agg(json_build_object('name', c.name, 'hex', c.hex) order by c.sort_order) from product_colors c where c.product_id = p.id), '[]') as colors,
      coalesce((select json_agg(json_build_object('id', v.id, 'color', v.color, 'size', v.size, 'stock', v.stock, 'sku', v.sku) order by v.color, v.size) from product_variants v where v.product_id = p.id), '[]') as variants,
      coalesce((select json_agg(json_build_object('id', k.id, 'name', k.name, 'slug', k.slug) order by k.sort_order) from product_categories pc join categories k on k.id = pc.category_id where pc.product_id = p.id), '[]') as categories,
      coalesce((select sum(stock) from product_variants v where v.product_id = p.id), 0)::int as stock_total
    from products p
    where true
      ${o.includeInactive ? sql`` : sql`and p.active`}
      ${o.ids ? sql`and p.id = any(${o.ids}::uuid[])` : sql``}
      ${o.slug ? sql`and p.slug = ${o.slug}` : sql``}
      ${o.category ? sql`and exists (select 1 from product_categories pc join categories k on k.id = pc.category_id where pc.product_id = p.id and k.slug = ${o.category})` : sql``}
      ${o.flag === 'is_new' ? sql`and p.is_new` : o.flag === 'is_bestseller' ? sql`and p.is_bestseller` : o.flag === 'is_featured' ? sql`and p.is_featured` : sql``}
      ${q ? sql`and (p.name ilike ${q} or p.description ilike ${q} or p.material ilike ${q} or exists (select 1 from product_colors c where c.product_id = p.id and c.name ilike ${q}) or exists (select 1 from product_categories pc join categories k on k.id = pc.category_id where pc.product_id = p.id and k.name ilike ${q}))` : sql``}
    order by p.sort_order, p.created_at desc
    ${o.limit ? sql`limit ${o.limit}` : sql``}`;
  const camps = await activeCampaigns();
  let out = rows.map(r => applyPricing(r, camps));
  if (o.flag === 'sale') out = out.filter(p => p.was);
  return out;
}

export async function getProduct(slug: string) { return (await listProducts({ slug }))[0] || null; }

export async function listCategories(activeOnly = true) {
  return sql`select k.*, (select count(*) from product_categories pc join products p on p.id = pc.product_id where pc.category_id = k.id and p.active)::int as product_count
             from categories k ${activeOnly ? sql`where k.active` : sql``} order by k.sort_order, k.name`;
}
