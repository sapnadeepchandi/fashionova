import Link from 'next/link';
import { getContent } from '@/lib/content';
import { Faqs } from '@/components/store/Faqs';
export const metadata = { title: 'FAQs' };
export default async function Page() {
  const faqs = await getContent<any[]>('faqs');
  return (<>
    <section className="page-hero"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link> / FAQs</div><h1>Frequently Asked Questions</h1></div></section>
    <div className="wrap"><div className="prose"><Faqs items={faqs} /></div></div>
  </>);
}
