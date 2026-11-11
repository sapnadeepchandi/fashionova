import type { Product } from './catalog';
/** Strip a product down to what the browser needs for cards */
export const toCard = (p: Product) => ({
  slug: p.slug, name: p.name, effective: p.effective, was: p.was, images: p.images.slice(0, 2), colors: p.colors,
  variants: p.variants.map(v => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
  categories: p.categories.map(c => ({ name: c.name, slug: c.slug })), is_new: p.is_new, is_bestseller: p.is_bestseller, stock_total: p.stock_total
});
