import 'server-only';
import { sql } from './db';

export const DEFAULTS: Record<string, any> = {
  store: {
    name: 'Fashionova', tagline: 'Luxury Footwear', currency: 'Rs.',
    email: 'care@fashionova.com', phone: '+44 20 7946 0123', address: '12 Mount Street, Mayfair, London W1K 2RJ', hours: 'Monday – Saturday, 9am – 6pm',
    instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/', tiktok: 'https://www.tiktok.com/', instagram_handle: '@fashionova',
    free_shipping_threshold: 15000, standard_rate: 450, express_rate: 850, nextday_rate: 1250,
    low_stock_threshold: 3, stock_deduct_on: 'confirmed',
    bank_details: 'Fashionova (Pvt) Ltd · Bank: [Bank name] · Branch: [Branch] · Account no: [000000000000] · Please use your order number as the reference.',
    payment_cod: true, payment_bank: true
  },
  announcements: ['New Collection — Discover Your Perfect Pair', 'Complimentary island-wide delivery on orders over Rs. 15,000', 'Free 30-day returns & exchanges'],
  hero: {
    eyebrow: 'The Autumn / Winter Collection', heading: 'Elegance Begins With', heading_accent: 'Every Step.',
    subheading: 'Discover footwear designed to make every moment unforgettable.', image_id: null,
    primary_label: 'Explore Collection', primary_href: '/collections/all',
    secondary_label: 'Shop New Arrivals', secondary_href: '/collections/new-arrivals'
  },
  trust: [
    { title: 'Premium Quality', text: 'Italian leathers, hand-finished' },
    { title: 'Free Delivery', text: 'On orders over Rs. 15,000' },
    { title: 'Easy Returns', text: '30-day free exchanges' },
    { title: 'Secure Checkout', text: 'Encrypted & protected' }
  ],
  sections: {
    categories_eyebrow: 'Curated for you', categories_title: 'Shop by Category',
    bestsellers_eyebrow: 'Most loved', bestsellers_title: 'Best Sellers',
    new_eyebrow: 'Just landed', new_title: 'New Arrivals', new_text: "Sculpted silhouettes, luminous finishes and softly pointed toes — the season's newest pieces, made in limited runs.",
    featured_eyebrow: 'Editor’s picks', featured_title: 'Featured Styles', show_featured: true
  },
  editorial: {
    eyebrow: 'The Evening Edit', heading: 'Made for', heading_accent: 'the moments', heading_end: 'that matter.',
    text: 'From candlelit dinners to black-tie soirées — heels that carry you through the night with ease.',
    button_label: 'Shop the Edit', button_href: '/collections/new-arrivals', image_id: null
  },
  story: {
    eyebrow: 'Our Story', heading: 'Designed for the Woman Who Moves', heading_accent: 'with Confidence.',
    body: 'Fashionova began with a simple belief: that beautiful shoes should never ask you to choose between elegance and comfort. Every pair begins as a sketch in our studio and is brought to life by artisans who have perfected their craft over generations.\n\nWe work with the finest Italian and Spanish leathers, cushion every footbed, and balance every heel by hand — so that each step feels as good as it looks. Timeless design, made to be worn and loved for years, not seasons.',
    stats: [{ value: '40+', label: 'Hand-finished steps' }, { value: '100%', label: 'Genuine leather lining' }, { value: '12k', label: 'Happy clients' }],
    button_label: 'Discover Our Story', button_href: '/pages/about', image_a: null, image_b: null
  },
  promo: {
    eyebrow: 'The Soirée Collection', heading: 'Step Into Something', heading_accent: 'Beautiful.',
    text: "Mirror-gold pumps, crystal straps and sculpted silhouettes — a limited collection for the season's most beautiful occasions.",
    button_label: 'Discover the Collection', button_href: '/collections/wedding-occasion', note: 'Limited edition · Hand-finished', image_id: null, visible: true
  },
  why: [
    { title: 'Premium Materials', text: 'Only the finest leathers, satins and suedes, sourced from heritage tanneries.' },
    { title: 'All-Day Comfort', text: 'Cushioned footbeds and balanced heels, designed to keep you comfortable from morning to night.' },
    { title: 'Gift-Ready Packaging', text: 'Every pair arrives in our signature box with dust bags — beautiful to receive or to give.' },
    { title: 'Personal Styling', text: 'Our client care team is here to help with sizing, styling and every step of your order.' }
  ],
  instagram: { title: 'Get Inspired', text: 'Tag us to be featured in our community gallery.', image_ids: [] },
  newsletter: { eyebrow: 'The Fashionova Letter', heading: 'Be the first to step into', heading_accent: 'something new.', text: 'Join for private previews, styling notes and 10% off your first order.' },
  pages: {
    about: { title: 'About Us', body: 'Fashionova was founded on a simple belief: that every woman deserves shoes that make her feel extraordinary — without compromising on comfort.\n\n## Our craft\nEach pair is designed in our studio and handcrafted by artisan partners in Italy, using leathers from heritage tanneries. More than forty hand-finished steps go into every shoe, from hand-lasting to the final polish.\n\n## Our promise\nTimeless design over passing trends. Cushioned footbeds and carefully balanced heels. Small-batch production that respects both people and materials.' },
    contact: { title: 'Contact Us', body: 'Our client care team is here to help with sizing, styling and your orders. We aim to reply to every message within one working day.' },
    shipping: { title: 'Shipping Information', body: '## Delivery options\n- Standard island-wide delivery (3–5 working days): Rs. 450, complimentary on orders over Rs. 15,000\n- Express delivery (1–2 working days): Rs. 850\n- Next-day premium (order before 2pm): Rs. 1,250\n\n## Dispatch\nOrders are dispatched from our London studio Monday to Friday. You will receive tracking details once your order ships.' },
    returns: { title: 'Returns Policy', body: 'We offer free returns and exchanges within 30 days of delivery.\n\n## Conditions\n- Shoes must be unworn with unmarked soles\n- Returned in the original box with dust bags\n\n## Refunds\nRefunds are made to your original payment method within 5 working days of your return arriving at our studio.' },
    privacy: { title: 'Privacy Policy', body: 'Your privacy matters to us. We collect only the information needed to process your orders, provide client care and — with your consent — share news about our collections.\n\n## What we collect\nContact details, delivery address and order history. We never store card numbers.\n\n## Your rights\nYou may access, correct or delete your data at any time by contacting our client care team.' },
    terms: { title: 'Terms & Conditions', body: 'By using this website and placing an order, you agree to the following terms.\n\n## Orders\nAll orders are subject to availability and acceptance.\n\n## Pricing\nAll prices are shown in Sri Lankan Rupees (LKR) and include applicable taxes.' }
  },
  faqs: [
    { q: 'How do Fashionova shoes fit?', a: 'Our styles fit true to EU sizing. If you are between sizes, we recommend the larger size.' },
    { q: 'What sizes do you offer?', a: 'EU 35 to 42. EU 35 = UK 2, EU 36 = UK 3, EU 37 = UK 4, EU 38 = UK 5, EU 39 = UK 6, EU 40 = UK 7, EU 41 = UK 8, EU 42 = UK 9.' },
    { q: 'How long will delivery take?', a: 'Standard delivery takes 3–5 working days, express 1–2 working days, and next-day premium arrives the following working day when ordered before 2pm.' },
    { q: 'Can I return or exchange my order?', a: 'Yes — returns and exchanges are free within 30 days of delivery, provided shoes are unworn and in their original packaging.' },
    { q: 'How do I care for my shoes?', a: 'Store them in the dust bags provided, wipe leather with a soft dry cloth, and use a suede brush for suede or velvet.' }
  ]
};

function merge(def: any, val: any) {
  if (Array.isArray(def)) return Array.isArray(val) ? val : def;
  if (def && typeof def === 'object') {
    const out: any = { ...def };
    if (val && typeof val === 'object') for (const k of Object.keys(val)) out[k] = (k in def) ? merge(def[k], val[k]) : val[k];
    return out;
  }
  return val ?? def;
}

export async function getContent<T = any>(
  key: string,
  db: any = sql
): Promise<T> {
  const [r] = await db`select value from site_content where key = ${key}`;
  return merge(DEFAULTS[key], r?.value) as T;
}
export async function getAllContent(keys = Object.keys(DEFAULTS)) {
  const rows = await sql`select key, value from site_content where key in ${sql(keys)}`;
  const map: Record<string, any> = {};
  for (const k of keys) map[k] = merge(DEFAULTS[k], rows.find(r => r.key === k)?.value);
  return map;
}
export async function setContent(key: string, value: any) {
  await sql`insert into site_content (key, value, updated_at) values (${key}, ${sql.json(value)}, now())
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
