import { Metadata } from 'next';
import { FAQJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez Verger & Com pour un devis personnalisé. Livraison de fruits frais en entreprise en Île-de-France.',
  keywords: [
    'contact',
    'devis fruits entreprise',
    'livraison fruits Paris',
  ],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact | Verger & Com',
    description: 'Contactez-nous pour un devis personnalisé.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Contactez Verger & Com pour un devis de livraison de fruits',
      },
    ],
  },
};

const faqs = [
  {
    question: 'Dans quelles zones livrez-vous vos fruits ?',
    answer:
      'Verger & Com livre en Île-de-France : Paris et les départements 92 (Hauts-de-Seine), 93 (Seine-Saint-Denis) et 94 (Val-de-Marne). La livraison est offerte sans minimum de commande.',
  },
  {
    question: 'Quelle est la fréquence de livraison disponible ?',
    answer:
      'Nous proposons des livraisons hebdomadaires, bimensuelles ou mensuelles selon vos besoins. Vous pouvez aussi passer une commande ponctuelle sans engagement.',
  },
  {
    question: 'Peut-on personnaliser le contenu de son panier ?',
    answer:
      'Oui, nous proposons des paniers composés (Petit, Moyen, Grand) mais aussi un configurateur en ligne pour composer votre panier sur mesure en choisissant les fruits de votre choix.',
  },
  {
    question: 'Quel est le délai pour passer une commande ?',
    answer:
      'Les commandes doivent être passées avant le vendredi soir pour une livraison la semaine suivante. Contactez-nous pour toute demande urgente.',
  },
  {
    question: 'Les fruits sont-ils vraiment frais et de saison ?',
    answer:
      'Oui, nous sélectionnons uniquement des fruits frais de saison, approvisionnés directement auprès de producteurs. Les paniers varient selon les saisons pour garantir qualité et fraîcheur.',
  },
];

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd faqs={faqs} />
      {children}
    </>
  );
}
