import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paniers de fruits frais',
  description:
    'Découvrez nos paniers de fruits frais de saison pour entreprises. Petit, Moyen ou Grand panier, livrés directement dans vos locaux en Île-de-France.',
  keywords: [
    'panier de fruits entreprise',
    'fruits frais QVT',
    'livraison fruits bureau',
    'avantages salariés fruits',
    'corbeille de fruits',
    'CSE livraison fruits',
    'fruits de saison',
  ],
  alternates: {
    canonical: '/paniers',
  },
  openGraph: {
    title: 'Paniers de fruits frais | Verger & Com',
    description:
      'Découvrez nos paniers de fruits frais de saison pour entreprises.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Paniers de fruits frais pour entreprises — Verger & Com',
      },
    ],
  },
};

export default function PaniersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
