import { requireAdminPage } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { PageHead } from '@/components/admin/bits';
import { ActionForm, Area, Chk, Num, Sel, Submit, Text } from '@/components/admin/ui';
import { saveSettings } from '@/app/admin/actions';
export const metadata = { title: 'Store settings' };
export default async function Settings() {
  await requireAdminPage('settings');
  const s = await getContent('store');
  return (<>
    <PageHead title="Store settings" sub="Delivery charges, payments and how stock is managed." />
    <ActionForm action={saveSettings}>
      <div className="cols-eq">
        <div className="panel"><h2>Delivery</h2><p className="sub">Prices shown at checkout.</p><div className="form-grid">
          <Text name="currency" label="Currency symbol" defaultValue={s.currency} hint="e.g. Rs. or LKR" /><Num name="free_shipping_threshold" label="Free standard delivery over (LKR)" step="1" defaultValue={s.free_shipping_threshold} />
          <Num name="standard_rate" label="Standard delivery (LKR)" step="1" defaultValue={s.standard_rate} /><Num name="express_rate" label="Express delivery (LKR)" step="1" defaultValue={s.express_rate} />
          <Num name="nextday_rate" label="Next-day delivery (LKR)" step="1" defaultValue={s.nextday_rate} /></div></div>
        <div className="panel"><h2>Inventory</h2><p className="sub">How stock is reduced and when you’re warned.</p><div className="form-grid">
          <Sel name="stock_deduct_on" label="Reduce stock when an order is…" full defaultValue={s.stock_deduct_on} options={[['placed', 'Placed by the customer'], ['confirmed', 'Confirmed by you (recommended)'], ['paid', 'Marked as paid']]} />
          <Num name="low_stock_threshold" label="Low-stock alert at" defaultValue={s.low_stock_threshold} hint="Sizes with this many pairs or fewer are flagged" /></div>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Cancelling an order always returns its stock. Customers can never order more than is in stock.</p></div>
      </div>
      <div className="panel"><h2>Payment methods</h2><p className="sub">Methods offered at checkout. Card payments need a payment provider — see the README.</p>
        <Chk name="payment_cod" label="Cash on delivery" defaultChecked={s.payment_cod} /><Chk name="payment_bank" label="Bank transfer" defaultChecked={s.payment_bank} />
        <div style={{ marginTop: 12 }}><Area name="bank_details" label="Bank transfer instructions" rows={3} defaultValue={s.bank_details} hint="Shown to customers who choose bank transfer." /></div></div>
      <div className="sticky-actions"><Submit>Save settings</Submit></div>
    </ActionForm>
  </>);
}
