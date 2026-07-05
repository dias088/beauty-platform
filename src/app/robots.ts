import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/masters/'],
      disallow: ['/dashboard/', '/admin/', '/api/', '/onboarding/'],
    },
    sitemap: 'https://beauty-platform.kz/sitemap.xml',
  }
}
