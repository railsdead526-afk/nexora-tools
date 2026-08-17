import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Larang Google mengintip panel admin & API rahasia
    },
    sitemap: 'https://nexora-tools.vercel.app/sitemap.xml',
  };
}
