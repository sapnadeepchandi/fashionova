import Link from 'next/link';
import { getAllContent } from '@/lib/content';
import { listCategories, listProducts } from '@/lib/catalog';
import { toCard } from '@/lib/serialize';
import { imgUrl } from '@/lib/format';
import { Grid } from '@/components/store/ProductCard';
import { BestSellers } from '@/components/store/BestSellers';
import { NewsletterForm } from '@/components/store/Forms';
import { Icon } from '@/components/store/Icons';

const bg = (id?: string | null) => (id ? { backgroundImage: `url(${imgUrl(id)})` } : {});

export default async function Home() {
  const [c, cats, best, fresh, featured] = await Promise.all([
    getAllContent(['hero', 'trust', 'sections', 'editorial', 'story', 'promo', 'why', 'instagram', 'newsletter', 'store']),
    listCategories(), listProducts({ flag: 'is_bestseller', limit: 12 }), listProducts({ flag: 'is_new', limit: 4 }), listProducts({ flag: 'is_featured', limit: 4 })
  ]);
  const { hero, trust, sections: s, editorial: ed, story, promo, why, instagram, newsletter, store } = c;
  const homeCats = cats.filter((k: any) => k.show_on_home).slice(0, 6);
  const trustIcons = ['gem', 'truck', 'ret', 'lock'], whyIcons = ['gem', 'feather', 'box', 'chat'];
  return (<>
    <section className="hero">
      <div className="hero-img" style={bg(hero.image_id)} role="img" aria-label="Featured footwear" />
      <div className="wrap"><div className="hero-copy hero-anim">
        <div className="eyebrow">{hero.eyebrow}</div>
        <h1>{hero.heading} <em>{hero.heading_accent}</em></h1>
        <p className="sub">{hero.subheading}</p>
        <div className="ctas">
          {hero.primary_label && <Link href={hero.primary_href || '/collections/all'} className="btn btn-dark">{hero.primary_label}</Link>}
          {hero.secondary_label && <Link href={hero.secondary_href || '/collections/new-arrivals'} className="btn btn-line">{hero.secondary_label}</Link>}
        </div>
      </div></div>
      <div className="scroll-cue">Scroll<i /></div>
    </section>

    <section className="trust"><div className="wrap">
      {trust.slice(0, 4).map((t: any, i: number) => <div className="t" key={i}><Icon n={trustIcons[i]} /><div><b>{t.title}</b><small>{t.text}</small></div></div>)}
    </div></section>

    {homeCats.length > 0 && <section className="sec"><div className="wrap">
      <div className="sec-head center rv"><span className="eyebrow">{s.categories_eyebrow}</span><h2 className="h-sec">{s.categories_title}</h2></div>
      <div className="cats">{homeCats.map((k: any) => (
        <Link className="cat rv" key={k.id} href={`/collections/${k.slug}`}><div className="ci" style={bg(k.image_id)} /><div className="cl"><h3>{k.name}</h3><span>Shop now <b>→</b></span></div></Link>
      ))}</div>
    </div></section>}

    {best.length > 0 && <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
      <BestSellers eyebrow={s.bestsellers_eyebrow} title={s.bestsellers_title} products={best.map(toCard)} />
    </div></section>}

    {fresh.length > 0 && <section className="sec editorial"><div className="wrap">
      <div className="sec-head rv"><div><span className="eyebrow">{s.new_eyebrow}</span><h2 className="h-sec" style={{ marginTop: 10 }}>{s.new_title}</h2></div><p>{s.new_text}</p></div>
      <div className="ed-grid">
        <div className="ed-feature rv" style={bg(ed.image_id)}>
          <div className="in"><span className="eyebrow">{ed.eyebrow}</span><h3>{ed.heading} <em>{ed.heading_accent}</em> {ed.heading_end}</h3><p>{ed.text}</p>
            {ed.button_label && <Link href={ed.button_href || '/collections/new-arrivals'} className="btn btn-light">{ed.button_label}</Link>}</div>
        </div>
        <Grid className="ed-side" products={fresh.map(toCard)} />
      </div>
    </div></section>}

    <section className="sec"><div className="wrap story">
      <div className="story-imgs rv">
        <div className="a" style={bg(story.image_a)} /><div className="b" style={bg(story.image_b)} />
        <div className="seal"><svg viewBox="0 0 100 100"><defs><path id="circ" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs><text fontFamily="Jost" fontSize="8.6" letterSpacing="3.4" fill="#8E6E3A"><textPath href="#circ">CRAFTED WITH CARE · {store.name.toUpperCase()} · </textPath></text><text x="50" y="57" textAnchor="middle" fontFamily="Cormorant Garamond" fontSize="22" fill="#3A2A22">{store.name[0]}</text></svg></div>
      </div>
      <div className="rv">
        <span className="eyebrow">{story.eyebrow}</span>
        <h2>{story.heading} <em>{story.heading_accent}</em></h2>
        {String(story.body).split(/\n\s*\n/).map((p: string, i: number) => <p key={i}>{p}</p>)}
        <div className="pillars">{story.stats.slice(0, 3).map((x: any, i: number) => <div key={i}><b>{x.value}</b><small>{x.label}</small></div>)}</div>
        {story.button_label && <Link href={story.button_href || '/pages/about'} className="btn btn-dark">{story.button_label}</Link>}
      </div>
    </div></section>

    {featured.length > 0 && s.show_featured && <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
      <div className="sec-head rv"><div><span className="eyebrow">{s.featured_eyebrow}</span><h2 className="h-sec" style={{ marginTop: 10 }}>{s.featured_title}</h2></div><Link href="/collections/featured" className="link-u">View all</Link></div>
      <Grid products={featured.map(toCard)} />
    </div></section>}

    {promo.visible && <section className="wrap"><div className="collection rv">
      <div className="txt">
        <span className="eyebrow">{promo.eyebrow}</span>
        <h2>{promo.heading} <em>{promo.heading_accent}</em></h2>
        <p>{promo.text}</p>
        {promo.button_label && <div><Link href={promo.button_href || '/collections/all'} className="btn btn-light">{promo.button_label}</Link></div>}
        {promo.note && <span className="ornament">{promo.note}</span>}
      </div>
      <div className="ph" style={bg(promo.image_id)} />
    </div></section>}

    <section className="sec"><div className="wrap">
      <div className="sec-head center rv"><span className="eyebrow">The {store.name} promise</span><h2 className="h-sec">Why Shop With Us</h2></div>
      <div className="why">{why.slice(0, 4).map((w: any, i: number) => <div className="rv" key={i}><Icon n={whyIcons[i]} /><h4>{w.title}</h4><p>{w.text}</p></div>)}</div>
    </div></section>

    {instagram.image_ids?.length > 0 && <section className="wrap" style={{ paddingBottom: 110 }}>
      <div className="sec-head center rv"><span className="eyebrow">{store.instagram_handle}</span><h2 className="h-sec">{instagram.title}</h2><p>{instagram.text}</p></div>
      <div className="insta rv">{instagram.image_ids.slice(0, 6).map((id: string) => <a key={id} href={store.instagram || '#'} target="_blank" rel="noopener noreferrer" aria-label="View on Instagram" style={bg(id)} />)}</div>
    </section>}

    <section className="wrap"><div className="news rv">
      <div><span className="eyebrow">{newsletter.eyebrow}</span><h2 style={{ marginTop: 12 }}>{newsletter.heading} <em>{newsletter.heading_accent}</em></h2><p>{newsletter.text}</p></div>
      <div><NewsletterForm variant="block" /><small>By subscribing you agree to our Privacy Policy. Unsubscribe anytime.</small></div>
    </div></section>
  </>);
}
