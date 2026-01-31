import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fruits secs & mélanges énergétiques',
  description:
    'Mélanges de fruits secs et oléagineux pour une pause gourmande au bureau. Énergie, chocolat, exotique. Livraison en entreprise.',
  keywords: [
    'fruits secs',
    'mélange énergétique',
    'oléagineux',
    'snack sain bureau',
    'fruits secs entreprise',
  ],
  openGraph: {
    title: 'Fruits secs | Verger & Com',
    description:
      'Mélanges de fruits secs et oléagineux pour une pause gourmande au bureau.',
    type: 'website',
  },
};

export default function FruitsSecsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
