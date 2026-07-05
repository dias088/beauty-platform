import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type Slot = {
  id: string
  starts_at: string
  ends_at: string
}

export async function getMasterSlots(masterId: string, daysAhead = 14): Promise<Slot[]> {
  const supabase = await createClient()
  const now = new Date()
  const future = new Date(now.getTime() + daysAhead * 86400000)

  const { data } = await supabase
    .from('slots')
    .select('id, starts_at, ends_at')
    .eq('master_id', masterId)
    .eq('is_booked', false)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', future.toISOString())
    .order('starts_at', { ascending: true })

  return data ?? []
}
