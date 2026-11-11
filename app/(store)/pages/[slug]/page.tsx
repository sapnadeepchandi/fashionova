import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllContent } from '@/lib/content';
import { RichText } from '@/lib/richtext';
import { ContactForm } from '@/components/store/Forms';

const KEYS = ['about', 'contact', 'shipping', 'returns', 'privacy', 'terms'];
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if (!KEYS.includes(slug)) return {};
  const { pages } = await getAllContent(['pages']); return { title: pages[slug]?.title };
}
export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!KEYS.includes(slug)) notFound();
  const { pages, store } = await getAllContent(['pages', 'store']);
  const pg = pages[slug];
  return (<>
    <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / {pg.title}</div><h1>{pg.title}</h1></div></section>
    {slug === 'contact' ? (
      <div className="wrap"><div className="contact-grid">
        <div className="contact-card">
          <div className="prose" style={{ padding: 0, marginBottom: 20 }}><RichText text={pg.body} /></div>
          <h4>Email</h4><p><a href={`mailto:${store.email}`}>{store.email}</a></p>
          <h4>Telephone</h4><p>{store.phone}</p>
          <h4>Boutique</h4><p>{store.address}</p>
          <h4>Opening hours</h4><p>{store.hours}</p>
        </div>
        <ContactForm topics={['Order enquiry', 'Sizing & fit', 'Returns & exchanges', 'Styling appointment', 'Other']} />
      </div></div>
    ) : <div className="wrap"><div className="prose"><RichText text={pg.body} /></div></div>}
  </>);
}
