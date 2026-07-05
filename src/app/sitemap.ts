import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://beauty-platform.kz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: masters } = await supabase
    .from('masters')
    .select('id, updated_at')
    .eq('is_active', true)

  const masterUrls: MetadataRoute.Sitemap = (masters ?? []).map(m => ({
    url: `${BASE_URL}/masters/${m.id}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: 'daily',  priority: 1 },
    { url: `${BASE_URL}/login`,   lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/register`,lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    ...masterUrls,
  ]
}
