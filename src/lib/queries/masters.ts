import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type MasterListItem = {
  id: string
  profile_id: string
  bio: string | null
  categories: string[]
  address: string | null
  lat: number | null
  lng: number | null
  rating: number
  reviews_count: number
  is_active: boolean
  primary_photo: string | null
  min_price: number | null
  full_name: string
  is_boosted: boolean
}

export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'reviews'

export type MasterFilters = {
  category?: string
  search?: string
  sort?: SortOption
  minPrice?: number
  maxPrice?: number
}

export async function getMasters(filters: MasterFilters = {}): Promise<MasterListItem[]> {
  const supabase = createAdminClient()

  let query = supabase
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
      boost_until,
      profiles (full_name),
      portfolio_photos (url, position),
      services (price_kzt)
    `)
    .eq('is_active', true)
    .order('boost_until', { ascending: false, nullsFirst: false })
    .order('rating', { ascending: false })
    .order('position', { referencedTable: 'portfolio_photos' })
    .limit(200)

  if (filters.category) {
    query = query.contains('categories', [filters.category])
  }

  if (filters.search) {
    query = query.or(`bio.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('getMasters error:', error)
    return []
  }

  let results = (data || []).map((m: any) => ({
    id: m.id,
    profile_id: m.profile_id,
    bio: m.bio,
    categories: m.categories || [],
    address: m.address,
    lat: m.lat,
    lng: m.lng,
    rating: m.rating,
    reviews_count: m.reviews_count,
    is_active: m.is_active,
    primary_photo: m.portfolio_photos?.[0]?.url ?? null,
    min_price: m.services?.length ? Math.min(...m.services.map((s: any) => s.price_kzt)) : null,
    full_name: (m.profiles as any)?.full_name || 'Мастер',
    is_boosted: m.boost_until ? new Date(m.boost_until) > new Date() : false,
  }))

  if (filters.minPrice) {
    results = results.filter(m => m.min_price !== null && m.min_price >= filters.minPrice!)
  }
  if (filters.maxPrice) {
    results = results.filter(m => m.min_price !== null && m.min_price <= filters.maxPrice!)
  }

  const boosted = results.filter(m => m.is_boosted)
  const rest = results.filter(m => !m.is_boosted)

  const sortFn = (a: MasterListItem, b: MasterListItem) => {
    switch (filters.sort) {
      case 'price_asc':  return (a.min_price ?? Infinity) - (b.min_price ?? Infinity)
      case 'price_desc': return (b.min_price ?? 0) - (a.min_price ?? 0)
      case 'reviews':    return b.reviews_count - a.reviews_count
      default:           return b.rating - a.rating
    }
  }

  return [...boosted.sort(sortFn), ...rest.sort(sortFn)]
}

export async function getMastersByIds(ids: string[]): Promise<MasterListItem[]> {
  if (ids.length === 0) return []
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('masters')
    .select(`
      id, profile_id, bio, categories, address, lat, lng, rating, reviews_count,
      is_active, boost_until,
      profiles (full_name),
      portfolio_photos (url, position),
      services (price_kzt)
    `)
    .in('id', ids)
    .eq('is_active', true)
    .order('position', { referencedTable: 'portfolio_photos' })

  if (error || !data) return []

  return data.map((m: any) => ({
    id: m.id,
    profile_id: m.profile_id,
    bio: m.bio,
    categories: m.categories || [],
    address: m.address,
    lat: m.lat,
    lng: m.lng,
    rating: m.rating,
    reviews_count: m.reviews_count,
    is_active: m.is_active,
    primary_photo: m.portfolio_photos?.[0]?.url ?? null,
    min_price: m.services?.length ? Math.min(...m.services.map((s: any) => s.price_kzt)) : null,
    full_name: (m.profiles as any)?.full_name || 'Мастер',
    is_boosted: m.boost_until ? new Date(m.boost_until) > new Date() : false,
  }))
}
