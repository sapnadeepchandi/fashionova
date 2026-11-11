import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getContent } from '@/lib/content';
import { PageHead } from '@/components/admin/bits';
import { ActionForm, Submit } from '@/components/admin/ui';
import { saveStock } from '@/app/admin/actions';
export const metadata = { title: 'Inventory' };
export default async function Inventory({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  await requireAdminPage('inventory');
  const { filter = 'all', q = '' } = await searchParams;
  const store = await getContent('store'); const low = Number(store.low_stock_threshold);
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const rows = await sql`select v.id, v.color, v.size, v.stock, v.sku, p.id as product_id, p.name, p.active, c.hex
    from product_variants v join products p on p.id = v.product_id left join product_colors c on c.product_id = p.id and c.name = v.color
    where (${q} = '' or p.name ilike ${like} or v.color ilike ${like} or v.sku ilike ${like})
      ${filter === 'low' ? sql`and v.stock <= ${low}` : filter === 'out' ? sql`and v.stock = 0` : sql``}
    order by p.name, v.color, v.size limit 600`;
  const [s] = await sql`select count(*) filter (where v.stock = 0)::int as out, count(*) filter (where v.stock > 0 and v.stock <= ${low})::int as low, coalesce(sum(v.stock),0)::int as pairs from product_variants v join products p on p.id = v.product_id where p.active`;
  const groups = new Map<string, any[]>(); rows.forEach((r: any) => { const k = r.product_id; groups.set(k, [...(groups.get(k) || []), r]); });
  return (<>
    <PageHead title="Inventory" sub={`${s.pairs} pairs in stock · ${s.low} sizes running low · ${s.out} sold out`} />
    <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
      <Link href="/admin/inventory" className="stat"><small>Pairs in stock</small><b>{s.pairs}</b></Link>
      <Link href="/admin/inventory?filter=low" className="stat"><small>Low stock (≤ {low})</small><b style={{ color: 'var(--warn)' }}>{s.low + s.out}</b><span>sizes need attention</span></Link>
      <Link href="/admin/inventory?filter=out" className="stat alert"><small>Out of stock</small><b>{s.out}</b><span>sizes can’t be ordered</span></Link>
    </div>
    <form className="filters">
      <div className="tabs" style={{ margin: 0, border: 0 }}>{[['all', 'All sizes'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([k, t]) => <Link key={k} href={`/admin/inventory?filter=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={filter === k ? 'on' : ''}>{t}</Link>)}</div>
      <input type="hidden" name="filter" value={filter} /><input className="inp" type="search" name="q" defaultValue={q} placeholder="Search product, colour or SKU" /><button className="btn btn-line">Search</button>
    </form>
    <ActionForm action={saveStock}>
      {[...groups.values()].map(g => <div className="panel" key={g[0].product_id} style={{ padding: 18 }}>
        <div className="panel-head" style={{ marginBottom: 10 }}><div><Link href={`/admin/products/${g[0].product_id}`} style={{ fontFamily: 'var(--serif)', fontSize: 21 }}>{g[0].name}</Link>{!g[0].active && <span className="pill off" style={{ marginLeft: 8 }}>Hidden</span>}</div></div>
        <div className="matrix"><table><tbody>{[...new Set(g.map(r => r.color))].map(color => <tr key={color}><th className="c"><span className="dot" style={{ background: g.find(r => r.color === color).hex || '#ccc' }} />{color}</th>
          {g.filter(r => r.color === color).map(r => <td key={r.id}><div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center' }}>EU {r.size}</div><input type="number" min={0} name={`v_${r.id}`} defaultValue={r.stock} className={r.stock === 0 ? 'zero' : r.stock <= low ? 'low' : ''} aria-label={`${g[0].name} ${color} EU ${r.size}`} /></td>)}</tr>)}</tbody></table></div>
      </div>)}
      {!rows.length && <div className="panel empty-s">{filter === 'all' ? 'No products found.' : 'Nothing here — stock levels look healthy.'}</div>}
      {rows.length > 0 && <div className="sticky-actions"><span className="muted" style={{ marginRight: 'auto', alignSelf: 'center', fontSize: 13 }}>Edit any number, then save. Stock is also reduced automatically when orders are {store.stock_deduct_on === 'placed' ? 'placed' : store.stock_deduct_on === 'paid' ? 'paid' : 'confirmed'}.</span><Submit>Save stock levels</Submit></div>}
    </ActionForm>
  </>);
}
