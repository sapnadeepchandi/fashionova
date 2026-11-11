'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.rv').forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv:not(.in)').forEach((el, i) => { (el as HTMLElement).style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
    return () => io.disconnect();
  }, [path]);
  return null;
}
