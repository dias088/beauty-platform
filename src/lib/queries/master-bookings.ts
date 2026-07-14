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

  // client_scores вкладываем ВНУТРЬ профиля клиента: между bookings и
  // client_scores нет прямой связи (обе ссылаются на profiles), а вот
  // profiles → client_scores связь есть. Плоский embed ронял весь запрос.
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      starts_at,
      ends_at,
      service_name_snapshot,
      price_kzt_snapshot,
      client_notes,
      profiles!bookings_client_id_fkey (
        full_name,
        avatar_url,
        client_scores (score, level)
      )
    `)
    .eq('master_id', masterId)
    .order('starts_at', { ascending: false })

  if (error) {
    console.error('getMasterBookings error:', error)
    return []
  }

  return (data ?? []).map((b: any) => {
    const cs = Array.isArray(b.profiles?.client_scores)
      ? b.profiles.client_scores[0]
      : b.profiles?.client_scores
    return {
      id: b.id,
      status: b.status,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      service_name_snapshot: b.service_name_snapshot,
      price_kzt_snapshot: b.price_kzt_snapshot,
      client_notes: b.client_notes,
      profiles: {
        full_name: b.profiles?.full_name ?? 'Клиент',
        avatar_url: b.profiles?.avatar_url ?? null,
      },
      client_scores: cs ? { score: cs.score, level: cs.level } : null,
    }
  })
}
