// Tiny, safe formatter for CMS text: blank line = new paragraph, "## " = heading, "- " = bullet.
export function RichText({ text }: { text: string }) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/);
  return <>{blocks.map((b, i) => {
    const lines = b.split('\n').filter(l => l.trim());
    if (!lines.length) return null;
    const out: React.ReactNode[] = []; let list: string[] = [];
    const flush = (k: string) => { if (list.length) { out.push(<ul key={k}>{list.map((l, j) => <li key={j}>{l}</li>)}</ul>); list = []; } };
    lines.forEach((l, j) => {
      if (l.startsWith('## ')) { flush(`u${j}`); out.push(<h2 key={j}>{l.slice(3)}</h2>); }
      else if (/^[-•] /.test(l)) list.push(l.slice(2));
      else { flush(`u${j}`); out.push(<p key={j}>{l}</p>); }
    });
    flush('end');
    return <div key={i}>{out}</div>;
  })}</>;
}
