import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vergercom.fr';

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
