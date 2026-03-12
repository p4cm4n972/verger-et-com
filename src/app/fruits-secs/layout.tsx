import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fruits secs & mélanges énergétiques',
  description:
    'Mélanges de fruits secs et oléagineux pour une pause gourmande au bureau. Énergie, chocolat, exotique. Livraison en entreprise.',
  keywords: [
    'fruits secs entreprise',
    'snack sain QVT',
    'mélange énergétique bureau',
    'avantages salariés snack',
    'oléagineux bureau',
    'bien-être salariés',
  ],
  alternates: {
    canonical: '/fruits-secs',
  },
  openGraph: {
    title: 'Fruits secs | Verger & Com',
    description:
      'Mélanges de fruits secs et oléagineux pour une pause gourmande au bureau.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fruits secs et mélanges énergétiques pour entreprises — Verger & Com',
      },
    ],
  },
};

export default function FruitsSecsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
