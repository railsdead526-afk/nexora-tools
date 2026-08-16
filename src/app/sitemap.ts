import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/config/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nexora-tools.vercel.app';
  const currentDate = new Date();

  // Halaman Utama & Pricing
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Seluruh Halaman 9 Tools
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: tool.isPremium ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
