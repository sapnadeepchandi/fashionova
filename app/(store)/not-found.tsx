import Link from 'next/link';
export default function NotFound() { return <div className="done"><h1>Page not found</h1><p>The page you’re looking for has stepped out.</p><Link href="/" className="btn btn-dark" style={{ marginTop: 20 }}>Return Home</Link></div>; }
