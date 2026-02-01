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
    "Livraison de fruits frais de saison pour vos équipes. Paniers composés ou personnalisés, livrés directement dans vos locaux. Livraison offerte en Île-de-France.",
  keywords: [
    "fruits frais",
    "panier de fruits",
    "entreprise",
    "livraison bureau",
    "fruits de saison",
    "bien-être au travail",
    "corbeille de fruits",
    "Paris",
    "Île-de-France",
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
      "Livraison de fruits frais de saison pour vos équipes. Paniers composés ou personnalisés, livrés directement dans vos locaux.",
    images: [
      {
        url: "/og-image.svg",
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
      "Livraison de fruits frais de saison pour vos équipes. Paniers composés ou personnalisés.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  verification: {
    google: "VOTRE_CODE_VERIFICATION_GOOGLE", // Remplacer par le code de Google Search Console
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
