import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { OrganizationJsonLd, LocalBusinessJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://vergercom.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Verger & Com | Paniers de fruits frais pour entreprises",
    template: "%s | Verger & Com",
  },
  description:
    "Livraison de fruits frais pour entreprises — levier QVT concret pour DRH et CSE. Fruits des primeurs de votre secteur, livrés le lundi et mardi. Abonnement, paiement en ligne, livraison offerte en Île-de-France.",
  keywords: [
    "QVT entreprise",
    "qualité de vie au travail",
    "bien-être salariés",
    "avantages salariés",
    "avantage en nature",
    "DRH fruits bureau",
    "CSE livraison fruits",
    "livraison fruits entreprise",
    "panier de fruits entreprise",
    "abonnement fruits entreprise",
    "primeurs fruits frais",
    "bien-être au travail",
    "Île-de-France",
    "Paris",
  ],
  authors: [{ name: "Verger & Com" }],
  creator: "Verger & Com",
  publisher: "Verger & Com",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Verger & Com",
    title: "Verger & Com | Paniers de fruits frais pour entreprises",
    description:
      "Levier QVT pour DRH et CSE : fruits frais des primeurs de votre secteur, livrés le lundi et mardi en entreprise. Abonnement et paiement en ligne.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Verger & Com - Fruits frais pour entreprises",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verger & Com | Paniers de fruits frais pour entreprises",
    description:
      "Levier QVT pour DRH et CSE : fruits frais livrés le lundi et mardi en entreprise. Abonnement et paiement en ligne.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/apple-icon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "l8coDgpRRrbjJaprG1igh5-PkdBXd4HF0BSoCu5chtA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
