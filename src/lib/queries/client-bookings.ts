import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type ClientBooking = {
  id: string
  status: string
  starts_at: string
  ends_at: string
  service_name_snapshot: string
  price_kzt_snapshot: number
  duration_minutes_snapshot: number
  master_id: string
  masters: {
    id: string
    profile_id: string
    rating: number
    address: string | null
    profiles: {
      full_name: string
      avatar_url: string | null
    }
  }
  reviews: Array<{
    id: string
    rating: number
    text: string | null
  }>
}

export type ClientScore = {
  score: number
  level: string
  total_bookings: number
  completed_bookings: number
  no_shows: number
  late_cancellations: number
}

export async function getClientBookings(clientId: string): Promise<ClientBooking[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      starts_at,
      ends_at,
      service_name_snapshot,
      price_kzt_snapshot,
      duration_minutes_snapshot,
      master_id,
      masters!inner (
        id,
        profile_id,
        rating,
        address,
        profiles!inner (full_name, avatar_url)
      ),
      reviews (id, rating, text)
    `)
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false })

  return (data as any[]) ?? []
}

export async function getClientScore(clientId: string): Promise<ClientScore | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('client_scores')
    .select('score, level, total_bookings, completed_bookings, no_shows, late_cancellations')
    .eq('client_id', clientId)
    .maybeSingle()

  return data
}
