import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commander',
  description:
    'Finalisez votre commande de fruits frais. Livraison hebdomadaire ou ponctuelle en entreprise.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CommanderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
