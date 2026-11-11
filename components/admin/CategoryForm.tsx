'use client';
import { ActionForm, Area, Chk, ImagePicker, Num, Submit, Text, type Res } from './ui';
export function CategoryForm({ action, c, reset }: { action: (p: Res | null, fd: FormData) => Promise<Res>; c?: any; reset?: boolean }) {
  return <ActionForm action={action} reset={reset}><div className="form-grid">
    <Text name="name" label="Name" defaultValue={c?.name} /><Text name="slug" label="Web address" defaultValue={c?.slug} hint="Optional — created from the name" />
    <Area name="description" label="Description" full rows={3} defaultValue={c?.description} />
    <ImagePicker name="image_id" label="Category image" defaultValue={c?.image_id} wide hint="Shown on the homepage “Shop by Category” tiles." />
    <Num name="sort_order" label="Display order" defaultValue={c?.sort_order ?? 0} />
    <div className="f"><span className="lbl">Visibility</span><Chk name="active" label="Active" defaultChecked={c ? c.active : true} /><Chk name="show_in_nav" label="Show in main menu" defaultChecked={c ? c.show_in_nav : true} /><Chk name="show_on_home" label="Show on homepage" defaultChecked={c ? c.show_on_home : true} /></div>
    <div className="form-actions full"><Submit>{c ? 'Save category' : 'Create category'}</Submit></div>
  </div></ActionForm>;
}
