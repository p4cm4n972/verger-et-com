import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paniers de fruits frais',
  description:
    'Découvrez nos paniers de fruits frais de saison pour entreprises. Petit, Moyen ou Grand panier, livrés directement dans vos locaux en Île-de-France.',
  keywords: [
    'panier de fruits',
    'fruits frais entreprise',
    'livraison fruits bureau',
    'corbeille de fruits',
    'fruits de saison',
  ],
  openGraph: {
    title: 'Paniers de fruits frais | Verger & Com',
    description:
      'Découvrez nos paniers de fruits frais de saison pour entreprises.',
    type: 'website',
  },
};

export default function PaniersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
