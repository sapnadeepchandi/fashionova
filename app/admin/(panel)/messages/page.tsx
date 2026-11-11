import { requireAdminPage } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { PageHead } from '@/components/admin/bits';
import { ActionButton } from '@/components/admin/ui';
import { deleteSubscriber, toggleMessage } from '@/app/admin/actions';
export const metadata = { title: 'Messages' };
export default async function Messages() {
  await requireAdminPage('messages');
  const [msgs, subs] = await Promise.all([sql`select * from contact_messages order by handled, created_at desc limit 200`, sql`select * from newsletter_subscribers order by created_at desc`]);
  return (<>
    <PageHead title="Messages & subscribers" sub="Contact form messages and newsletter sign-ups from the website." />
    <div className="cols">
      <div className="panel"><h2 style={{ marginBottom: 12 }}>Contact messages</h2>
        {msgs.map((m: any) => <div key={m.id} style={{ borderBottom: '1px solid var(--line)', padding: '14px 0', opacity: m.handled ? .6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><div><b style={{ fontWeight: 500 }}>{m.name}</b> · <a className="link" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic)}`}>{m.email}</a><div className="muted" style={{ fontSize: 12.5 }}>{m.topic} · {fmtDate(m.created_at, true)}</div></div>
            <ActionButton action={toggleMessage} args={[m.id]}>{m.handled ? 'Mark as open' : 'Mark as handled'}</ActionButton></div>
          <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{m.message}</p></div>)}
        {!msgs.length && <div className="empty-s">No messages yet.</div>}</div>
      <div className="panel"><h2>Newsletter subscribers</h2><p className="sub">{subs.length} subscribers. Copy the list into your email marketing tool.</p>
        <textarea readOnly className="inp" style={{ height: 90, padding: 10, fontSize: 12.5, marginBottom: 12 }} value={subs.map((s: any) => s.email).join(', ')} aria-label="All subscriber emails" />
        <table className="t"><tbody>{subs.map((s: any) => <tr key={s.id}><td>{s.email}<div className="muted" style={{ fontSize: 12 }}>{fmtDate(s.created_at)}</div></td><td className="right"><ActionButton action={deleteSubscriber} args={[s.id]} className="btn btn-danger btn-sm" confirm={`Remove ${s.email}?`}>Remove</ActionButton></td></tr>)}</tbody></table></div>
    </div>
  </>);
}
