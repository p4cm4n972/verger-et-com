import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon abonnement',
  description: 'Gérez votre abonnement de livraison de fruits Verger & Com.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MonAbonnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
