import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jus de fruits',
  description:
    'Jus de fruits 100% pur jus, pressés et naturels. Orange, pomme, multifruits en format 25cl ou 1L. Livraison en entreprise.',
  keywords: [
    'jus de fruits',
    'jus pressé',
    'pur jus',
    'jus orange entreprise',
    'boisson naturelle',
  ],
  alternates: {
    canonical: '/jus',
  },
  openGraph: {
    title: 'Jus de fruits | Verger & Com',
    description: 'Jus de fruits 100% pur jus, pressés et naturels.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jus de fruits pressés et naturels — Verger & Com',
      },
    ],
  },
};

export default function JusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
