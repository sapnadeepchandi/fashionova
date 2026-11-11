export function money(n: number, cur = 'Rs.') {
  const v = Number(n || 0);
  const num = v.toLocaleString('en-GB', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
  return cur + (/[A-Za-z.]$/.test(cur) ? ' ' : '') + num; // "Rs. 18,900" / "LKR 18,900" / "£189"
}
export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
export function imgUrl(id?: string | null) { return id ? `/api/images/${id}` : ''; }
export function fmtDate(d: string | Date, withTime = false) {
  const x = new Date(d);
  return x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
}
export const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export const SIZES = [35, 36, 37, 38, 39, 40, 41, 42];
export const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
