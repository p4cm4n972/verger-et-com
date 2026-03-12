import { Metadata } from 'next';
import { FAQJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'DRH, CSE, responsables RH : contactez Verger & Com pour un devis livraison de fruits frais en entreprise. Un levier QVT simple, eco-responsable et flexible en Île-de-France.',
  keywords: [
    'contact DRH fruits entreprise',
    'devis QVT livraison fruits',
    'CSE fruits bureau',
    'avantages salariés devis',
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
    question: 'Quels sont les jours de livraison ?',
    answer:
      'Verger & Com livre le lundi et le mardi directement dans vos locaux en Île-de-France. Les commandes doivent être passées avant le vendredi soir pour être livrées la semaine suivante.',
  },
  {
    question: 'D\'où viennent vos fruits ?',
    answer:
      'Nous approvisionnons nos fruits auprès des primeurs de votre secteur. Ce circuit court garantit une fraîcheur maximale et réduit significativement l\'empreinte carbone liée au transport.',
  },
  {
    question: 'Comment fonctionne le paiement ?',
    answer:
      'Le paiement s\'effectue entièrement en ligne, de façon sécurisée. Vous réglez votre commande ou votre abonnement directement sur notre site par carte bancaire.',
  },
  {
    question: 'Y a-t-il une formule d\'abonnement ?',
    answer:
      'Oui, nous proposons un abonnement hebdomadaire, bimensuel ou mensuel. L\'abonnement vous garantit une livraison régulière sans avoir à repasser commande, avec possibilité de modifier ou suspendre à tout moment.',
  },
  {
    question: 'Peut-on personnaliser son panier ?',
    answer:
      'Absolument. En plus de nos paniers composés (Petit, Moyen, Grand), notre configurateur en ligne vous permet de composer votre panier sur mesure en sélectionnant les fruits de votre choix.',
  },
  {
    question: 'Dans quelles zones livrez-vous ?',
    answer:
      'Verger & Com livre en Île-de-France : Paris et les départements limitrophes (92, 93, 94). La livraison est offerte.',
  },
  {
    question: 'En quoi la livraison de fruits améliore-t-elle la QVT ?',
    answer:
      'Offrir des fruits frais à ses salariés est un levier QVT concret et apprécié : meilleure concentration, réduction de la fatigue, sentiment de bien-être au travail. C\'est aussi un avantage en nature simple à mettre en place pour les DRH et CSE, géré intégralement en ligne avec un abonnement flexible.',
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
