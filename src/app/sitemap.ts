import { MetadataRoute } from 'next';

const baseUrl = 'https://vergercom.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/paniers`,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/paniers/composer`,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/jus`,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fruits-secs`,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2025-02-27'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cgv`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
