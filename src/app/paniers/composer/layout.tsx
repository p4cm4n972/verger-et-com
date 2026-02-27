import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Composez votre panier de fruits personnalisé — Verger & Com',
      },
    ],
  },
};

export default function ComposerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Accueil', url: 'https://vergercom.fr' },
          { name: 'Paniers', url: 'https://vergercom.fr/paniers' },
          { name: 'Composer votre panier', url: 'https://vergercom.fr/paniers/composer' },
        ]}
      />
      {children}
    </>
  );
}
