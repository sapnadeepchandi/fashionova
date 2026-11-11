import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { getAllContent } from '@/lib/content';
import { listProducts } from '@/lib/catalog';
import { imgUrl } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { ActionButton, ActionForm, Area, Chk, ImagePicker, Repeater, Submit, Text } from '@/components/admin/ui';
import { saveSection, toggleProduct } from '@/app/admin/actions';

export const metadata = { title: 'Homepage' };
const Panel = ({ id, title, sub, children }: any) => <div className="panel" id={id}><h2>{title}</h2>{sub && <p className="sub">{sub}</p>}{children}</div>;
const Save = () => <div className="form-actions full"><Submit>Save section</Submit></div>;

export default async function Homepage() {
  await requireAdminPage('content');
  const [c, products] = await Promise.all([getAllContent(), listProducts({ includeInactive: true })]);
  const { hero, announcements, sections: s, editorial: ed, story, promo, trust, why, instagram: ig, newsletter: nl } = c;
  const sec = (k: string) => saveSection.bind(null, k);
  const links = [['announce', 'Announcements'], ['hero', 'Hero banner'], ['products', 'Featured products'], ['titles', 'Section titles'], ['editorial', 'New arrivals feature'], ['story', 'Brand story'], ['promo', 'Promo banner'], ['trust', 'Trust & why us'], ['insta', 'Instagram'], ['news', 'Newsletter']];
  return (<>
    <PageHead title="Homepage" sub="Everything on the homepage. Changes go live as soon as you save."><a className="btn btn-line" href="/" target="_blank" rel="noopener">Preview homepage ↗</a></PageHead>
    <div className="tabs">{links.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</div>

    <Panel id="announce" title="Announcement bar" sub="Rotating messages at the very top of every page. One message per line. Active campaigns add their own message automatically.">
      <ActionForm action={sec('announcements')}><div className="form-grid"><Area name="announcements" full rows={4} defaultValue={announcements.join('\n')} /><Save /></div></ActionForm></Panel>

    <Panel id="hero" title="Hero banner" sub="The large image and headline customers see first.">
      <ActionForm action={sec('hero')}><div className="form-grid">
        <ImagePicker name="image_id" label="Banner image" defaultValue={hero.image_id} wide hint="Landscape photo, at least 1600px wide. The left third sits behind the headline." />
        <Text name="eyebrow" label="Small heading above" defaultValue={hero.eyebrow} full />
        <Text name="heading" label="Main heading" defaultValue={hero.heading} /><Text name="heading_accent" label="Heading — gold italic ending" defaultValue={hero.heading_accent} />
        <Area name="subheading" label="Subtitle" full rows={2} defaultValue={hero.subheading} />
        <Text name="primary_label" label="Button 1 text" defaultValue={hero.primary_label} /><Text name="primary_href" label="Button 1 link" defaultValue={hero.primary_href} hint="e.g. /collections/all" />
        <Text name="secondary_label" label="Button 2 text" defaultValue={hero.secondary_label} hint="Leave blank to hide" /><Text name="secondary_href" label="Button 2 link" defaultValue={hero.secondary_href} /><Save /></div></ActionForm></Panel>

    <Panel id="products" title="Best sellers, new arrivals & featured" sub="Choose which products appear in each homepage section. Click to switch on or off.">
      <div className="tbl-wrap"><table className="t"><thead><tr><th></th><th>Product</th><th>New Arrivals</th><th>Best Sellers</th><th>Featured</th></tr></thead><tbody>
        {products.map(p => <tr key={p.id}><td style={{ width: 56 }}>{p.images[0] && <img className="thumb" src={imgUrl(p.images[0])} alt="" />}</td><td><Link href={`/admin/products/${p.id}`}>{p.name}</Link>{!p.active && <span className="muted"> (hidden)</span>}</td>
          {(['is_new', 'is_bestseller', 'is_featured'] as const).map(f => <td key={f}><ActionButton action={toggleProduct} args={[p.id, f]} className={'pill ' + (p[f] ? 'on' : 'off')}>{p[f] ? 'Shown' : 'Off'}</ActionButton></td>)}</tr>)}
      </tbody></table></div><p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Order follows each product’s “display order” number. New Arrivals shows 4, Best Sellers up to 8, Featured 4.</p></Panel>

    <Panel id="titles" title="Section titles">
      <ActionForm action={sec('sections')}><div className="form-grid">
        <Text name="categories_eyebrow" label="Categories — small heading" defaultValue={s.categories_eyebrow} /><Text name="categories_title" label="Categories — title" defaultValue={s.categories_title} />
        <Text name="bestsellers_eyebrow" label="Best sellers — small heading" defaultValue={s.bestsellers_eyebrow} /><Text name="bestsellers_title" label="Best sellers — title" defaultValue={s.bestsellers_title} />
        <Text name="new_eyebrow" label="New arrivals — small heading" defaultValue={s.new_eyebrow} /><Text name="new_title" label="New arrivals — title" defaultValue={s.new_title} />
        <Area name="new_text" label="New arrivals — intro" full rows={2} defaultValue={s.new_text} />
        <Text name="featured_eyebrow" label="Featured — small heading" defaultValue={s.featured_eyebrow} /><Text name="featured_title" label="Featured — title" defaultValue={s.featured_title} />
        <div className="full"><Chk name="show_featured" label="Show the Featured section" defaultChecked={s.show_featured} /></div><Save /></div></ActionForm></Panel>

    <Panel id="editorial" title="New arrivals feature" sub="The large image card beside the new arrivals.">
      <ActionForm action={sec('editorial')}><div className="form-grid">
        <ImagePicker name="image_id" label="Image" defaultValue={ed.image_id} wide /><Text name="eyebrow" label="Small heading" defaultValue={ed.eyebrow} full />
        <Text name="heading" label="Heading start" defaultValue={ed.heading} /><Text name="heading_accent" label="Heading — gold italic" defaultValue={ed.heading_accent} /><Text name="heading_end" label="Heading end" defaultValue={ed.heading_end} full />
        <Area name="text" label="Text" full rows={2} defaultValue={ed.text} /><Text name="button_label" label="Button text" defaultValue={ed.button_label} /><Text name="button_href" label="Button link" defaultValue={ed.button_href} /><Save /></div></ActionForm></Panel>

    <Panel id="story" title="Brand story">
      <ActionForm action={sec('story')}><div className="form-grid">
        <ImagePicker name="image_a" label="Large image" defaultValue={story.image_a} wide /><ImagePicker name="image_b" label="Small overlapping image" defaultValue={story.image_b} wide />
        <Text name="eyebrow" label="Small heading" defaultValue={story.eyebrow} full /><Text name="heading" label="Heading" defaultValue={story.heading} /><Text name="heading_accent" label="Heading — gold italic ending" defaultValue={story.heading_accent} />
        <Area name="body" label="Story text (leave a blank line between paragraphs)" full rows={7} defaultValue={story.body} />
        <div className="f full"><span className="lbl">Highlights (up to 3)</span><Repeater name="stats" fields={[{ key: 'value', label: 'Figure' }, { key: 'label', label: 'Label' }]} defaultValue={story.stats} addLabel="Add highlight" max={3} /></div>
        <Text name="button_label" label="Button text" defaultValue={story.button_label} /><Text name="button_href" label="Button link" defaultValue={story.button_href} /><Save /></div></ActionForm></Panel>

    <Panel id="promo" title="Promotional banner" sub="The dark full-width collection banner.">
      <ActionForm action={sec('promo')}><div className="form-grid">
        <div className="full"><Chk name="visible" label="Show this banner" defaultChecked={promo.visible} /></div>
        <ImagePicker name="image_id" label="Image" defaultValue={promo.image_id} wide /><Text name="eyebrow" label="Small heading" defaultValue={promo.eyebrow} full />
        <Text name="heading" label="Heading" defaultValue={promo.heading} /><Text name="heading_accent" label="Heading — gold italic ending" defaultValue={promo.heading_accent} />
        <Area name="text" label="Text" full rows={2} defaultValue={promo.text} /><Text name="button_label" label="Button text" defaultValue={promo.button_label} /><Text name="button_href" label="Button link" defaultValue={promo.button_href} />
        <Text name="note" label="Small print" defaultValue={promo.note} full /><Save /></div></ActionForm></Panel>

    <div className="cols-eq" id="trust">
      <Panel title="Trust strip" sub="Four short promises under the hero."><ActionForm action={sec('trust')}><Repeater name="items" fields={[{ key: 'title', label: 'Title' }, { key: 'text', label: 'Text' }]} defaultValue={trust} max={4} /><Save /></ActionForm></Panel>
      <Panel title="Why shop with us" sub="Four reasons, shown as cards."><ActionForm action={sec('why')}><Repeater name="items" fields={[{ key: 'title', label: 'Title' }, { key: 'text', label: 'Text', area: true }]} defaultValue={why} max={4} /><Save /></ActionForm></Panel>
    </div>

    <Panel id="insta" title="Instagram gallery" sub="Up to six square images. They link to your Instagram profile (set under Pages & Info).">
      <ActionForm action={sec('instagram')}><div className="form-grid"><Text name="title" label="Title" defaultValue={ig.title} /><Text name="text" label="Text" defaultValue={ig.text} />
        <ImagePicker name="image_ids" multiple defaultValue={ig.image_ids} /><Save /></div></ActionForm></Panel>

    <Panel id="news" title="Newsletter block">
      <ActionForm action={sec('newsletter')}><div className="form-grid"><Text name="eyebrow" label="Small heading" defaultValue={nl.eyebrow} full /><Text name="heading" label="Heading" defaultValue={nl.heading} /><Text name="heading_accent" label="Heading — gold italic ending" defaultValue={nl.heading_accent} />
        <Area name="text" label="Text" full rows={2} defaultValue={nl.text} /><Save /></div></ActionForm></Panel>
  </>);
}
