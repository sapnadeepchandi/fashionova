'use client';
import { ActionForm, Area, Chk, Num, Sel, Submit, Text, type Res } from './ui';
const dt = (d?: string | Date | null) => d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
export function CodeForm({ action, c }: { action: (p: Res | null, fd: FormData) => Promise<Res>; c?: any }) {
  return <ActionForm action={action} reset={!c}><div className="form-grid">
    <Text name="code" label="Code" defaultValue={c?.code} placeholder="e.g. SPRING20" /><Sel name="kind" label="Type" defaultValue={c?.kind || 'percent'} options={[['percent', 'Percentage off'], ['fixed', 'Fixed amount off']]} />
    <Num name="value" label="Value" step="1" defaultValue={c?.value} hint="e.g. 10 for 10%, or 2500 for Rs. 2,500 off" /><Num name="min_order" label="Minimum order (LKR)" step="1" defaultValue={c?.min_order ?? 0} />
    <Text name="starts_at" label="Starts (optional)" type="datetime-local" defaultValue={dt(c?.starts_at)} /><Text name="expires_at" label="Expires (optional)" type="datetime-local" defaultValue={dt(c?.expires_at)} />
    <Num name="usage_limit" label="Usage limit (optional)" defaultValue={c?.usage_limit ?? ''} hint="Total number of times it can be used" /><Text name="description" label="Internal description" defaultValue={c?.description} />
    <div className="full"><Chk name="active" label="Active" defaultChecked={c ? c.active : true} /></div>
    <div className="form-actions full"><Submit>{c ? 'Save code' : 'Create code'}</Submit></div></div></ActionForm>;
}
export function CampaignForm({ action, c, cats }: { action: (p: Res | null, fd: FormData) => Promise<Res>; c?: any; cats: any[] }) {
  return <ActionForm action={action} reset={!c}><div className="form-grid">
    <Text name="name" label="Campaign name" defaultValue={c?.name} full /><Num name="percent_off" label="Discount %" step="0.5" defaultValue={c?.percent_off} />
    <Sel name="category_id" label="Applies to" defaultValue={c?.category_id || ''} options={[['', 'Whole store'], ...cats.map((k: any) => [k.id, k.name] as [string, string])]} />
    <Text name="starts_at" label="Starts" type="datetime-local" defaultValue={dt(c?.starts_at)} /><Text name="ends_at" label="Ends" type="datetime-local" defaultValue={dt(c?.ends_at)} />
    <Text name="announcement" label="Announcement bar message (optional)" defaultValue={c?.announcement} full /><Area name="description" label="Internal notes" full rows={2} defaultValue={c?.description} />
    <div className="full"><Chk name="active" label="Active" defaultChecked={c ? c.active : true} /></div>
    <div className="form-actions full"><Submit>{c ? 'Save campaign' : 'Create campaign'}</Submit></div></div></ActionForm>;
}
export function SalePriceForm({ action, value }: { action: (p: Res | null, fd: FormData) => Promise<Res>; value: any }) {
  return <ActionForm action={action}><div style={{ display: 'flex', gap: 6 }}><input className="inp" style={{ width: 100, height: 34 }} type="number" step="1" min={0} name="sale_price" defaultValue={value ?? ''} placeholder="—" aria-label="Sale price" /><Submit className="btn btn-line btn-sm">Set</Submit></div></ActionForm>;
}
