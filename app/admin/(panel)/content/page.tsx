import { requireAdminPage } from '@/lib/auth';
import { getAllContent } from '@/lib/content';
import { PageHead } from '@/components/admin/bits';
import { ActionForm, Area, Repeater, Submit, Text } from '@/components/admin/ui';
import { saveFaqs, savePage, saveStoreInfo } from '@/app/admin/actions';
export const metadata = { title: 'Pages & Info' };
const LABELS: Record<string, string> = { about: 'About Us', contact: 'Contact Us (intro)', shipping: 'Shipping Information', returns: 'Returns Policy', privacy: 'Privacy Policy', terms: 'Terms & Conditions' };
export default async function Content() {
  await requireAdminPage('pages');
  const { pages, faqs, store } = await getAllContent(['pages', 'faqs', 'store']);
  return (<>
    <PageHead title="Pages & store information" sub="Edit your information pages, FAQs, contact details and social links." />
    <div className="tabs">{[['store', 'Contact & social'], ...Object.entries(LABELS), ['faqs', 'FAQs']].map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</div>
    <div className="panel" id="store"><h2>Contact details &amp; social media</h2><p className="sub">Shown in the footer, on the Contact page and in the header.</p>
      <ActionForm action={saveStoreInfo}><div className="form-grid">
        <Text name="name" label="Store name" defaultValue={store.name} /><Text name="tagline" label="Tagline under the logo" defaultValue={store.tagline} />
        <Text name="email" label="Email" type="email" defaultValue={store.email} /><Text name="phone" label="Phone" defaultValue={store.phone} />
        <Text name="address" label="Boutique address" defaultValue={store.address} full /><Text name="hours" label="Opening hours" defaultValue={store.hours} full />
        <Text name="instagram" label="Instagram link" defaultValue={store.instagram} placeholder="https://www.instagram.com/yourshop" /><Text name="instagram_handle" label="Instagram handle" defaultValue={store.instagram_handle} placeholder="@yourshop" />
        <Text name="facebook" label="Facebook link" defaultValue={store.facebook} /><Text name="tiktok" label="TikTok link" defaultValue={store.tiktok} />
        <div className="form-actions full"><Submit>Save details</Submit></div></div></ActionForm></div>
    {Object.entries(LABELS).map(([k, label]) => <div className="panel" id={k} key={k}><div className="panel-head"><h2>{label}</h2><a className="link" href={`/pages/${k}`} target="_blank" rel="noopener">View page ↗</a></div>
      <ActionForm action={savePage.bind(null, k)}><div className="form-grid"><Text name="title" label="Page title" defaultValue={pages[k].title} full />
        <Area name="body" label="Content" full rows={10} defaultValue={pages[k].body} hint="Formatting: leave a blank line between paragraphs · start a line with ## for a heading · start a line with - for a bullet point." />
        <div className="form-actions full"><Submit>Save page</Submit></div></div></ActionForm></div>)}
    <div className="panel" id="faqs"><div className="panel-head"><h2>FAQs</h2><a className="link" href="/faqs" target="_blank" rel="noopener">View page ↗</a></div>
      <ActionForm action={saveFaqs}><Repeater name="items" fields={[{ key: 'q', label: 'Question' }, { key: 'a', label: 'Answer', area: true }]} defaultValue={faqs} addLabel="Add question" /><div className="form-actions"><Submit>Save FAQs</Submit></div></ActionForm></div>
  </>);
}
