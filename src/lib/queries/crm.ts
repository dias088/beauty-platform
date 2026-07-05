import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type CrmClient = {
  client_id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  total_visits: number
  total_spent: number
  last_visit: string | null
  score: number
  level: string
  notes: string | null
}

export type CrmBooking = {
  id: string
  starts_at: string
  status: string
  service_name_snapshot: string
  price_kzt_snapshot: number
  discount_pct: number | null
  client_notes: string | null
  master_notes: string | null
}

export async function getCrmClients(masterId: string): Promise<CrmClient[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select(`
      client_id,
      price_kzt_snapshot,
      starts_at,
      status,
      profiles!bookings_client_id_fkey (full_name, avatar_url, phone),
      client_scores!client_scores_client_id_fkey (score, level)
    `)
    .eq('master_id', masterId)
    .in('status', ['completed', 'confirmed', 'pending', 'no_show'])
    .order('starts_at', { ascending: false })

  if (!data) return []

  // Агрегируем по клиенту
  const map = new Map<string, CrmClient>()

  for (const row of data as any[]) {
    const existing = map.get(row.client_id)
    const isCompleted = row.status === 'completed'

    if (!existing) {
      map.set(row.client_id, {
        client_id:   row.client_id,
        full_name:   row.profiles?.full_name ?? 'Клиент',
        avatar_url:  row.profiles?.avatar_url ?? null,
        phone:       row.profiles?.phone ?? null,
        total_visits: isCompleted ? 1 : 0,
        total_spent:  isCompleted ? row.price_kzt_snapshot : 0,
        last_visit:   isCompleted ? row.starts_at : null,
        score:        row.client_scores?.[0]?.score ?? 0,
        level:        row.client_scores?.[0]?.level ?? 'new',
        notes:        null,
      })
    } else {
      if (isCompleted) {
        existing.total_visits += 1
        existing.total_spent  += row.price_kzt_snapshot
        if (!existing.last_visit || row.starts_at > existing.last_visit) {
          existing.last_visit = row.starts_at
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_visits - a.total_visits)
}

export async function getClientBookingsForMaster(masterId: string, clientId: string): Promise<CrmBooking[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select('id, starts_at, status, service_name_snapshot, price_kzt_snapshot, discount_pct, client_notes, master_notes')
    .eq('master_id', masterId)
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false })

  return (data as CrmBooking[]) ?? []
}
