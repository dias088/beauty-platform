import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export async function getMasterProfile(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('masters')
    .select(`
      id,
      profile_id,
      bio,
      categories,
      address,
      lat,
      lng,
      rating,
      reviews_count,
      is_active,
      instagram_handle,
      boost_until,
      profiles!masters_profile_id_fkey!inner (id, full_name, avatar_url),
      services (id, name, description, category, price_kzt, duration_minutes),
      portfolio_photos (id, url, position),
      reviews (id, rating, text, created_at, profiles!reviews_client_id_fkey (full_name, avatar_url))
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    notFound()
  }

  return data as any
}
