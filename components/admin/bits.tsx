import { money } from '@/lib/format';
export const Pill = ({ s }: { s: string }) => <span className={'pill ' + s}>{s.replace('_', ' ')}</span>;
export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return <div className="ph"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="acts">{children}</div>}</div>;
}
const short = (v: number, cur: string) => { const sp = /[A-Za-z.]$/.test(cur) ? ' ' : ''; return v >= 1e6 ? `${cur}${sp}${Math.round(v / 1e5) / 10}M` : v >= 1000 ? `${cur}${sp}${Math.round(v / 100) / 10}k` : `${cur}${sp}${Math.round(v)}`; };
export function SalesChart({ data, cur }: { data: { label: string; total: number; orders: number }[]; cur: string }) {
  const W = 760, H = 240, pad = 34, bw = (W - pad) / data.length;
  const max = Math.max(1, ...data.map(d => d.total));
  const nice = Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)));
  return <svg className="chart bars" viewBox={`0 0 ${W} ${H + 30}`} role="img" aria-label="Monthly sales">
    {[0, .5, 1].map(f => <g key={f}><line x1={pad} x2={W} y1={H - f * (H - 20)} y2={H - f * (H - 20)} stroke="#EFE7DC" /><text x={pad - 6} y={H - f * (H - 20) + 4} textAnchor="end">{f ? short(nice * f, cur) : '0'}</text></g>)}
    {data.map((d, i) => { const h = d.total / nice * (H - 20); const x = pad + i * bw + bw * .2;
      return <g key={i}><rect x={x} y={H - h} width={bw * .6} height={Math.max(h, 0)} rx="5" fill={i === data.length - 1 ? '#B8955A' : '#D9C9B4'}><title>{`${d.label}: ${money(d.total, cur)} · ${d.orders} orders`}</title></rect>
        <text x={x + bw * .3} y={H + 18} textAnchor="middle">{d.label}</text></g>; })}
  </svg>;
}
