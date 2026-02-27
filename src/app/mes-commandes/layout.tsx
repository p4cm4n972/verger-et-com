import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes commandes',
  description: 'Consultez l\'historique de vos commandes Verger & Com.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MesCommandesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
