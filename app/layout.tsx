import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Fashionova — Luxury Women’s Footwear', template: '%s — Fashionova' },
  description: 'Luxury women’s heels, flats, sandals and sneakers, crafted for the woman who moves with confidence.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
