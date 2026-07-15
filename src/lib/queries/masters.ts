import 'server-only'
// Каталог — публичные данные (активные мастера). Читаем бескуковым публичным
// клиентом (RLS-политики masters_public_read / profiles_public_read_master /
// services_public_read / portfolio_public_read открывают ровно этот набор),
// поэтому результат можно кешировать. От service_role каталог не зависит.
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

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
  // Категории, в которых у мастера ЕСТЬ услуги (для размещения в каталоге).
  // Отличается от `categories` — тех, что мастер отметил как специализацию в профиле.
  service_categories: string[]
}

export type SortOption = 'rating' | 'price_asc' | 'price_desc' | 'reviews'

export type MasterFilters = {
  category?: string
  search?: string
  sort?: SortOption
  minPrice?: number
  maxPrice?: number
}

async function fetchMasters(filters: MasterFilters = {}): Promise<MasterListItem[]> {
  const supabase = createPublicClient()

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
      profiles!masters_profile_id_fkey (full_name),
      portfolio_photos (url, position),
      services (price_kzt, category)
    `)
    .eq('is_active', true)
    .order('boost_until', { ascending: false, nullsFirst: false })
    .order('rating', { ascending: false })
    .order('position', { referencedTable: 'portfolio_photos' })
    .limit(200)

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
    service_categories: [...new Set(((m.services as any[]) ?? []).map(s => s.category).filter(Boolean))] as string[],
    full_name: (m.profiles as any)?.full_name || 'Мастер',
    is_boosted: m.boost_until ? new Date(m.boost_until) > new Date() : false,
  }))

  // Фильтр по категории — по УСЛУГАМ мастера (а не по галочкам специализации)
  if (filters.category) {
    results = results.filter(m => m.service_categories.includes(filters.category!))
  }

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

/**
 * Публичный каталог с кешем на 60с (по комбинации фильтров). Резко срезает
 * TTFB и число запросов к БД — данные каталога меняются нечасто.
 */
export async function getMasters(filters: MasterFilters = {}): Promise<MasterListItem[]> {
  const cached = unstable_cache(
    () => fetchMasters(filters),
    ['getMasters', JSON.stringify(filters)],
    { revalidate: 60, tags: ['masters'] }
  )
  return cached()
}

export async function getMastersByIds(ids: string[]): Promise<MasterListItem[]> {
  if (ids.length === 0) return []
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('masters')
    .select(`
      id, profile_id, bio, categories, address, lat, lng, rating, reviews_count,
      is_active, boost_until,
      profiles!masters_profile_id_fkey (full_name),
      portfolio_photos (url, position),
      services (price_kzt, category)
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
    service_categories: [...new Set(((m.services as any[]) ?? []).map(s => s.category).filter(Boolean))] as string[],
    full_name: (m.profiles as any)?.full_name || 'Мастер',
    is_boosted: m.boost_until ? new Date(m.boost_until) > new Date() : false,
  }))
}
