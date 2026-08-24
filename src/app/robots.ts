import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/site';

const siteUrl = APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
