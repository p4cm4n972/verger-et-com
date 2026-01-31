import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez Verger & Com pour un devis personnalisé. Livraison de fruits frais en entreprise en Île-de-France.',
  keywords: [
    'contact',
    'devis fruits entreprise',
    'livraison fruits Paris',
  ],
  openGraph: {
    title: 'Contact | Verger & Com',
    description: 'Contactez-nous pour un devis personnalisé.',
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
