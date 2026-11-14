import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-commerce-dun-seven-24.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms', '/privacy', '/dpa'],
        disallow: ['/api/', '/admin/', '/*?*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
