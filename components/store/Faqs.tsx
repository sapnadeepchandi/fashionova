'use client';
import { useState } from 'react';
export function Faqs({ items }: { items: { q: string; a: string }[] }) {
  const [o, setO] = useState(0);
  return <>{items.map((f, i) => <div key={i} className={'acc' + (o === i ? ' open' : '')}><button className="h" onClick={() => setO(o === i ? -1 : i)}>{f.q}<i /></button><div className="b"><div><div className="bi">{f.a}</div></div></div></div>)}</>;
}
