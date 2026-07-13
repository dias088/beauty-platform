import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  // Точная копия запроса каталога (getMasters) — чтобы увидеть реальную ошибку
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

  return NextResponse.json({
    count: data?.length ?? 0,
    error: error?.message ?? null,
    errorDetails: error ?? null,
    firstRow: data?.[0] ?? null,
  })
}
