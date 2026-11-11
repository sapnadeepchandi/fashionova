import './store.css';
import Link from 'next/link';
import { getAllContent } from '@/lib/content';
import { activeCampaigns, listCategories } from '@/lib/catalog';
import { StoreProvider } from '@/components/store/StoreProvider';
import { Announcements, Header, Overlays } from '@/components/store/StoreChrome';
import { Reveal } from '@/components/store/Reveal';
import { Social } from '@/components/store/Icons';
import { NewsletterForm } from '@/components/store/Forms';

// Every request reads the live database, so CMS changes appear immediately.
export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ store, announcements, newsletter }, cats, camps] = await Promise.all([getAllContent(['store', 'announcements', 'newsletter']), listCategories(), activeCampaigns()]);
  const navCats = cats.filter((c: any) => c.show_in_nav).map((c: any) => ({ name: c.name, slug: c.slug }));
  const allCats = cats.map((c: any) => ({ name: c.name, slug: c.slug }));
  const ann = [...camps.map((c: any) => c.announcement).filter(Boolean), ...announcements].filter(Boolean);
  return (
    <StoreProvider currency={store.currency} freeShip={Number(store.free_shipping_threshold)}>
      {ann.length > 0 && <Announcements items={ann} />}
      <Header cats={navCats} store={store} />
      <main>{children}</main>
      <footer>
        <div className="wrap">
          <div className="f-grid">
            <div>
              <Link href="/" className="logo"><span className="word">{store.name.toUpperCase()}</span><span className="tag">{store.tagline}</span></Link>
              <p>Footwear designed for the woman who moves with confidence — crafted in small batches from the finest leathers.</p>
              <div className="socials">
                {(['instagram', 'facebook', 'tiktok'] as const).filter(k => store[k]).map(k => <a key={k} href={store[k]} target="_blank" rel="noopener noreferrer" aria-label={k}>{Social[k]}</a>)}
              </div>
            </div>
            <div><h5>Shop</h5><ul>
              <li><Link href="/collections/new-arrivals">New Arrivals</Link></li>
              {allCats.slice(0, 6).map(c => <li key={c.slug}><Link href={`/collections/${c.slug}`}>{c.name}</Link></li>)}
              <li><Link href="/collections/sale">Sale</Link></li></ul></div>
            <div><h5>Maison</h5><ul>
              <li><Link href="/pages/about">About Us</Link></li><li><Link href="/pages/contact">Contact Us</Link></li><li><Link href="/faqs">FAQs</Link></li>
              <li><Link href="/account">My Account</Link></li><li><Link href="/wishlist">Wishlist</Link></li></ul></div>
            <div><h5>Client Care</h5><ul>
              <li><Link href="/pages/shipping">Shipping Information</Link></li><li><Link href="/pages/returns">Returns Policy</Link></li>
              <li><Link href="/pages/privacy">Privacy Policy</Link></li><li><Link href="/pages/terms">Terms &amp; Conditions</Link></li></ul>
              <p style={{ margin: '18px 0 0' }}>{store.email}<br />{store.phone}</p></div>
            <div className="f-news"><h5>{newsletter.eyebrow}</h5>
              <p style={{ margin: '0 0 10px' }}>{newsletter.text}</p>
              <NewsletterForm variant="footer" />
            </div>
          </div>
          <div className="f-bottom">
            <span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span>
            <div className="pay"><span>CASH ON DELIVERY</span><span>BANK TRANSFER</span></div>
          </div>
        </div>
      </footer>
      <Overlays cats={navCats} store={store} />
      <Reveal />
    </StoreProvider>
  );
}
