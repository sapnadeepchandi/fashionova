'use client';
import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';
import { PendingCtx, useAction, usePending } from '@/lib/useAction';
import { useRouter } from 'next/navigation';

export type Res = { ok: boolean; message?: string; errors?: Record<string, string>; redirect?: string };

// ---------- toasts ----------
type T = { id: number; msg: string; err?: boolean };
const ToastCtx = createContext<(msg: string, err?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<T[]>([]);
  const push = (msg: string, err = false) => { const id = Date.now() + Math.random(); setList(l => [...l, { id, msg, err }]); setTimeout(() => setList(l => l.filter(x => x.id !== id)), err ? 6000 : 3500); };
  return <ToastCtx.Provider value={push}>{children}<div className="toasts" role="status">{list.map(t => <div key={t.id} className={'toast' + (t.err ? ' err' : '')}><i>{t.err ? '!' : '✓'}</i><span>{t.msg}</span></div>)}</div></ToastCtx.Provider>;
}

// ---------- forms ----------
const ErrCtx = createContext<Record<string, string>>({});
export function ActionForm({ action, children, className, reset, confirm: confirmMsg, id }: {
  action: (prev: Res | null, fd: FormData) => Promise<Res>; children: React.ReactNode; className?: string; reset?: boolean; confirm?: string; id?: string;
}) {
  const [state, onSubmit, pending] = useAction(action, { confirm: confirmMsg });
  const toast = useToast(); const router = useRouter(); const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state) return;
    if (state.message) toast(state.message, !state.ok);
    if (state.ok && reset) ref.current?.reset();
    if (state.ok && state.redirect) router.push(state.redirect);
    else if (state.ok) router.refresh();
  }, [state]); // eslint-disable-line
  return (
    <ErrCtx.Provider value={state?.ok ? {} : state?.errors || {}}><PendingCtx.Provider value={pending}>
      <form id={id} ref={ref} className={className} noValidate onSubmit={onSubmit}>
        {state && !state.ok && state.message && <div className="alert err">{state.message}</div>}
        {children}
      </form>
    </PendingCtx.Provider></ErrCtx.Provider>
  );
}
export function Submit({ children, className = 'btn btn-dark', form }: { children: React.ReactNode; className?: string; form?: string }) {
  const pending = usePending();
  return <button type="submit" form={form} className={className} disabled={pending}>{pending ? <><span className="spinner" /> Saving…</> : children}</button>;
}

type FP = { name: string; label?: string; hint?: string; full?: boolean; defaultValue?: any; required?: boolean; placeholder?: string };
function Wrap({ name, label, hint, full, children }: FP & { children: React.ReactNode }) {
  const errs = useContext(ErrCtx);
  return <div className={'f' + (full ? ' full' : '') + (errs[name] ? ' err' : '')}>{label && <label htmlFor={name}>{label}</label>}{children}{errs[name] ? <div className="emsg">{errs[name]}</div> : hint && <div className="hint">{hint}</div>}</div>;
}
export const Text = (p: FP & { type?: string }) => <Wrap {...p}><input id={p.name} name={p.name} type={p.type || 'text'} defaultValue={p.defaultValue ?? ''} required={p.required} placeholder={p.placeholder} autoComplete="off" /></Wrap>;
export const Num = (p: FP & { step?: string; min?: number }) => <Wrap {...p}><input id={p.name} name={p.name} type="number" step={p.step || '1'} min={p.min} defaultValue={p.defaultValue ?? ''} required={p.required} placeholder={p.placeholder} /></Wrap>;
export const Area = (p: FP & { rows?: number }) => <Wrap {...p}><textarea id={p.name} name={p.name} rows={p.rows || 4} defaultValue={p.defaultValue ?? ''} placeholder={p.placeholder} /></Wrap>;
export const Sel = (p: FP & { options: (string | [string, string])[] }) => <Wrap {...p}><select id={p.name} name={p.name} defaultValue={p.defaultValue ?? ''}>{p.options.map(o => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>)}</select></Wrap>;
export const Chk = ({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) => <label className="check"><input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} />{label}</label>;

// ---------- image upload ----------
async function shrink(file: File): Promise<Blob> {
  // Resize large photos in the browser before upload (keeps uploads fast and under hosting limits)
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5e6) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.88));
  } catch { return file; }
}
export function ImagePicker({ name, multiple, defaultValue, wide, label, hint }: { name: string; multiple?: boolean; defaultValue?: string[] | string | null; wide?: boolean; label?: string; hint?: string }) {
  const init = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
  const [ids, setIds] = useState<string[]>(init);
  const [busy, setBusy] = useState(0);
  const toast = useToast(); const input = useRef<HTMLInputElement>(null);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, multiple ? 12 : 1);
    setBusy(list.length);
    for (const f of list) {
      try {
        const fd = new FormData(); fd.append('file', new File([await shrink(f)], f.name, { type: f.size < 1.5e6 ? f.type : 'image/jpeg' }));
        const r = await fetch('/api/admin/images', { method: 'POST', body: fd }); const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Upload failed');
        setIds(x => multiple ? [...x, d.id] : [d.id]);
      } catch (e: any) { toast(`${f.name}: ${e.message}`, true); }
      setBusy(b => b - 1);
    }
    if (input.current) input.current.value = '';
  }
  const move = (i: number, d: number) => setIds(x => { const a = [...x]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  return (
    <div className="f full">
      {label && <span className="lbl">{label}</span>}
      <input type="hidden" name={name} value={multiple ? JSON.stringify(ids) : ids[0] || ''} />
      <div className={'imgs' + (wide ? ' wide' : '')}>
        {ids.map((id, i) => <div className="it" key={id}><img src={`/api/images/${id}`} alt="" />{multiple && i === 0 && <span className="first">Main</span>}
          <div className="tools">{multiple && <><button type="button" onClick={() => move(i, -1)} aria-label="Move left">‹</button><button type="button" onClick={() => move(i, 1)} aria-label="Move right">›</button></>}
            <button type="button" onClick={() => setIds(x => x.filter(y => y !== id))} aria-label="Remove image" style={{ color: 'var(--bad)' }}>✕</button></div></div>)}
        {(multiple || !ids.length) && <label className="add">{busy ? <span><span className="spinner" /><br />Uploading…</span> : <span>＋<br />{multiple ? 'Add images' : 'Upload image'}</span>}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} hidden onChange={e => upload(e.target.files)} /></label>}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

// ---------- repeater for lists (FAQs, stats …) ----------
export function Repeater({ name, fields, defaultValue, addLabel = 'Add item', max = 50 }: { name: string; fields: { key: string; label: string; area?: boolean }[]; defaultValue: any[]; addLabel?: string; max?: number }) {
  const [rows, setRows] = useState<any[]>(defaultValue?.length ? defaultValue : []);
  const set = (i: number, k: string, v: string) => setRows(r => r.map((x, j) => j === i ? { ...x, [k]: v } : x));
  return (<div className="full">
    <input type="hidden" name={name} value={JSON.stringify(rows)} />
    {rows.map((r, i) => <div className="rep-row" key={i} style={{ gridTemplateColumns: `${fields.map(f => f.area ? '2fr' : '1fr').join(' ')} 34px` }}>
      {fields.map(f => <div className="f" key={f.key}><label>{f.label}</label>{f.area ? <textarea rows={3} value={r[f.key] || ''} onChange={e => set(i, f.key, e.target.value)} /> : <input type="text" value={r[f.key] || ''} onChange={e => set(i, f.key, e.target.value)} />}</div>)}
      <button type="button" className="x" onClick={() => setRows(x => x.filter((_, j) => j !== i))} aria-label="Remove" style={{ marginTop: 22 }}>✕</button>
    </div>)}
    {rows.length < max && <button type="button" className="btn btn-line btn-sm" onClick={() => setRows(r => [...r, {}])}>＋ {addLabel}</button>}
  </div>);
}

// ---------- one-click server actions (delete, toggles) ----------
export function ActionButton({ action, args, children, className = 'btn btn-line btn-sm', confirm: msg }: { action: (...a: any[]) => Promise<Res>; args: any[]; children: React.ReactNode; className?: string; confirm?: string }) {
  const [pending, start] = useTransition(); const toast = useToast(); const router = useRouter();
  return <button type="button" className={className} disabled={pending} onClick={() => {
    if (msg && !confirm(msg)) return;
    start(async () => { const r = await action(...args); if (r?.message) toast(r.message, !r.ok); if (r?.ok && r.redirect) router.push(r.redirect); else router.refresh(); });
  }}>{pending ? <span className="spinner" /> : children}</button>;
}
