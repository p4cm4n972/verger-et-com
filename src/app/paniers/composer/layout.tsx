import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Composer votre panier de fruits',
  description:
    'Composez votre panier de fruits personnalisé. Choisissez vos fruits préférés et la fréquence de livraison pour votre entreprise.',
  keywords: [
    'composer panier fruits',
    'panier personnalisé',
    'fruits sur mesure',
    'livraison fruits entreprise',
  ],
  alternates: {
    canonical: '/paniers/composer',
  },
  openGraph: {
    title: 'Composer votre panier | Verger & Com',
    description: 'Composez votre panier de fruits personnalisé pour votre entreprise.',
    type: 'website',
  },
};

export default function ComposerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
