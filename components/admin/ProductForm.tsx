'use client';
import { useMemo, useState } from 'react';
import { ActionForm, Area, Chk, ImagePicker, Num, Submit, Text, type Res } from './ui';

const ALL_SIZES = [35, 36, 37, 38, 39, 40, 41, 42];

export function ProductForm({ action, product, categories, lowStock }: { action: (p: Res | null, fd: FormData) => Promise<Res>; product?: any; categories: any[]; lowStock: number }) {
  const p = product || {};
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(p.colors?.length ? p.colors : [{ name: 'Black', hex: '#1E1A18' }]);
  const initSizes = p.variants?.length ? [...new Set<number>(p.variants.map((v: any) => v.size))].sort() : ALL_SIZES;
  const [sizes, setSizes] = useState<number[]>(initSizes);
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries((p.variants || []).map((v: any) => [`${v.color}|${v.size}`, v.stock])));
  const [name, setName] = useState(p.name || '');
  const [fill, setFill] = useState('10');
  const validColors = colors.filter(c => c.name.trim());
  const variants = useMemo(() => validColors.flatMap(c => sizes.map(s => ({ color: c.name.trim(), size: s, stock: Number(stock[`${c.name.trim()}|${s}`] ?? 0) }))), [validColors, sizes, stock]);
  const total = variants.reduce((a, v) => a + v.stock, 0);
  const setC = (i: number, k: 'name' | 'hex', v: string) => setColors(cs => cs.map((c, j) => {
    if (j !== i) return c;
    if (k === 'name') { // keep stock numbers when a colour is renamed
      setStock(st => { const n = { ...st }; for (const s of ALL_SIZES) { const o = `${c.name.trim()}|${s}`; if (o in n) { n[`${v.trim()}|${s}`] = n[o]; } } return n; });
    }
    return { ...c, [k]: v };
  }));
  const pc = new Set((p.categories || []).map((c: any) => c.id));

  return (
    <ActionForm action={action}>
      <input type="hidden" name="colors" value={JSON.stringify(validColors.map(c => ({ name: c.name.trim(), hex: c.hex })))} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <div className="cols">
        <div>
          <div className="panel"><h2>Product details</h2><p className="sub">What customers see on the product page.</p>
            <div className="form-grid">
              <div className="f full"><label htmlFor="name">Product name</label><input id="name" name="name" type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
              <Text name="slug" label="Web address (slug)" full defaultValue={p.slug} hint={`Leave blank to create from the name. Page: /products/${p.slug || (name ? name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '…')}`} />
              <Area name="description" label="Description" full rows={5} defaultValue={p.description} />
              <Area name="details" label="Details & fit (one point per line)" full rows={5} defaultValue={p.details} />
              <Text name="heel" label="Heel" defaultValue={p.heel} placeholder="e.g. 95mm stiletto" />
              <Text name="material" label="Material" defaultValue={p.material} placeholder="e.g. Italian calf leather" />
            </div></div>

          <div className="panel"><h2>Images</h2><p className="sub">The first image is the main photo; the second appears on hover. JPG, PNG or WebP, up to 4 MB each — large photos are resized automatically.</p>
            <ImagePicker name="images" multiple defaultValue={p.images || []} /></div>

          <div className="panel"><h2>Colours, sizes &amp; stock</h2><p className="sub">Stock is tracked for every colour and size. Cells turn amber at {lowStock} or fewer and red at zero.</p>
            <div className="colors-ed">
              <span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--choc-2)', display: 'block', marginBottom: 6 }}>Colours</span>
              {colors.map((c, i) => <div className="row" key={i}>
                <input type="color" value={c.hex} onChange={e => setC(i, 'hex', e.target.value)} aria-label="Colour swatch" />
                <input className="inp" type="text" value={c.name} placeholder="Colour name" onChange={e => setC(i, 'name', e.target.value)} />
                <input className="inp" type="text" value={c.hex} onChange={e => setC(i, 'hex', e.target.value)} aria-label="Hex code" />
                <button type="button" className="btn-danger" style={{ height: 34, borderRadius: 8, border: 0 }} onClick={() => setColors(cs => cs.filter((_, j) => j !== i))} aria-label="Remove colour">✕</button>
              </div>)}
              <button type="button" className="btn btn-line btn-sm" onClick={() => setColors(cs => [...cs, { name: '', hex: '#D9B99B' }])}>＋ Add colour</button>
            </div>
            <div style={{ margin: '22px 0' }}><span className="lbl" style={{ fontSize: 12, fontWeight: 500, color: 'var(--choc-2)', display: 'block', marginBottom: 6 }}>Available sizes (EU)</span>
              <div className="sizes-pick">{ALL_SIZES.map(s => <label key={s}><input type="checkbox" checked={sizes.includes(s)} onChange={e => setSizes(x => e.target.checked ? [...x, s].sort() : x.filter(y => y !== s))} /><span>{s}</span></label>)}</div></div>
            {validColors.length > 0 && sizes.length > 0 ? <>
              <div className="matrix"><table><thead><tr><th className="c">Stock</th>{sizes.map(s => <th key={s}>{s}</th>)}</tr></thead>
                <tbody>{validColors.map(c => <tr key={c.name}><th className="c"><span className="dot" style={{ background: c.hex }} />{c.name}</th>
                  {sizes.map(s => { const k = `${c.name.trim()}|${s}`; const v = Number(stock[k] ?? 0);
                    return <td key={s}><input type="number" min={0} value={stock[k] ?? 0} className={v === 0 ? 'zero' : v <= lowStock ? 'low' : ''} onChange={e => setStock(st => ({ ...st, [k]: Math.max(0, parseInt(e.target.value || '0')) }))} aria-label={`${c.name} EU ${s} stock`} /></td>; })}</tr>)}</tbody></table></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                <span className="muted" style={{ fontSize: 13 }}>Total: <b>{total}</b> pairs · Set all to</span>
                <input className="inp" style={{ width: 80, height: 34 }} type="number" min={0} value={fill} onChange={e => setFill(e.target.value)} />
                <button type="button" className="btn btn-line btn-sm" onClick={() => setStock(Object.fromEntries(variants.map(v => [`${v.color}|${v.size}`, Math.max(0, parseInt(fill || '0'))])))}>Apply</button>
              </div></> : <div className="alert warn">Add at least one colour and one size.</div>}
          </div>
        </div>

        <div>
          <div className="panel"><h2>Pricing</h2><p className="sub">Set a sale price to show the product as reduced.</p>
            <div className="form-grid"><Num name="price" label="Regular price (LKR)" step="1" min={0} defaultValue={p.price} /><Num name="sale_price" label="Sale price (LKR)" step="1" min={0} defaultValue={p.sale_price} hint="Optional" /></div></div>
          <div className="panel"><h2>Visibility</h2>
            <Chk name="active" label="Active — visible on the website" defaultChecked={product ? p.active : true} />
            <div style={{ marginTop: 12 }} className="lbl">Labels &amp; homepage sections</div>
            <Chk name="is_new" label="New Arrival" defaultChecked={p.is_new} /><Chk name="is_bestseller" label="Bestseller" defaultChecked={p.is_bestseller} /><Chk name="is_featured" label="Featured" defaultChecked={p.is_featured} />
            <div style={{ marginTop: 12 }}><Num name="sort_order" label="Display order" defaultValue={p.sort_order ?? 0} hint="Lower numbers appear first" /></div>
          </div>
          <div className="panel"><h2>Categories</h2><p className="sub">A product can be in several categories. The first ticked is its main category.</p>
            {categories.map(c => <label className="check" key={c.id}><input type="checkbox" name="categories" value={c.id} defaultChecked={pc.has(c.id)} />{c.name}{!c.active && <span className="muted"> (hidden)</span>}</label>)}
            {!categories.length && <p className="muted">Create a category first.</p>}
          </div>
        </div>
      </div>
      <div className="sticky-actions"><Submit>{product ? 'Save changes' : 'Create product'}</Submit></div>
    </ActionForm>
  );
}
