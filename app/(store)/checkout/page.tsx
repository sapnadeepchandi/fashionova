import { getCustomer } from '@/lib/auth';
import { Checkout } from '@/components/store/Checkout';
export const metadata = { title: 'Checkout' };
export default async function Page() { return <Checkout customer={await getCustomer()} />; }
