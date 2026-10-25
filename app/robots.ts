import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/agent', '/list/', '/lists/'],
    },
    sitemap: 'https://www.miamiapartmentguy.com/sitemap.xml',
    host: 'https://www.miamiapartmentguy.com',
  }
}
