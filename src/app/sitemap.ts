import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/config/tools';

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-tools-nexora-bcbb.vercel.app').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

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

  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: tool.isPremium ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
