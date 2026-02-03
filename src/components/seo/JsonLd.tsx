// JSON-LD structured data components for SEO
// Content is static/controlled - no user input, safe for dangerouslySetInnerHTML

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Verger & Com",
    url: "https://verger-et-com.vercel.app",
    logo: "https://verger-et-com.vercel.app/logo.svg",
    description:
      "Livraison de fruits frais de saison pour entreprises en Île-de-France",
    address: {
      "@type": "PostalAddress",
      streetAddress: "87 avenue Aristide Briand",
      addressLocality: "Antony",
      postalCode: "92160",
      addressRegion: "Île-de-France",
      addressCountry: "FR",
    },
    email: "contact@vergercom.fr",
    telephone: "+33759612533",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33759612533",
      email: "contact@vergercom.fr",
      contactType: "customer service",
      availableLanguage: "French",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://verger-et-com.vercel.app",
    name: "Verger & Com",
    image: "https://verger-et-com.vercel.app/og-image.svg",
    description:
      "Livraison de paniers de fruits frais pour entreprises. Fruits de saison, jus et fruits secs.",
    url: "https://verger-et-com.vercel.app",
    priceRange: "€€",
    telephone: "+33759612533",
    email: "contact@vergercom.fr",
    address: {
      "@type": "PostalAddress",
      streetAddress: "87 avenue Aristide Briand",
      addressLocality: "Antony",
      addressRegion: "Île-de-France",
      postalCode: "92160",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 48.7543,
      longitude: 2.2934,
    },
    areaServed: {
      "@type": "Place",
      name: "Île-de-France",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  price: number;
  image?: string;
}

export function ProductJsonLd({ name, description, price, image }: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || "https://verger-et-com.vercel.app/og-image.svg",
    brand: {
      "@type": "Brand",
      name: "Verger & Com",
    },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Verger & Com",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
