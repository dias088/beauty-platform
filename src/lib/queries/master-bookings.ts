import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type MasterBooking = {
  id: string
  status: string
  starts_at: string
  ends_at: string
  service_name_snapshot: string
  price_kzt_snapshot: number
  client_notes: string | null
  profiles: {
    full_name: string
    avatar_url: string | null
  }
  client_scores: {
    score: number
    level: string
  } | null
}

export async function getMasterBookings(masterId: string): Promise<MasterBooking[]> {
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
      client_notes,
      profiles!bookings_client_id_fkey (full_name, avatar_url),
      client_scores!client_scores_client_id_fkey (score, level)
    `)
    .eq('master_id', masterId)
    .order('starts_at', { ascending: false })

  return (data as any[]) ?? []
}
