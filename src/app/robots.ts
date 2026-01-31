import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://verger-et-com.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/livreur',
          '/livreur/*',
          '/api/*',
          '/commander/succes',
          '/mes-commandes',
          '/mon-abonnement',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
