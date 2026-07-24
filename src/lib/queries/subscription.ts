import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/lib/billing/types'

/** Подписка текущего мастера (или null). RLS отдаёт только свою. */
export async function getMySubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: master } = await supabase
    .from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('master_id', (master as any).id)
    .maybeSingle()

  return (data as Subscription | null) ?? null
}

/** Pro активен, если статус active, либо период ещё не истёк (canceled/past_due). */
export function isProActive(sub: Subscription | null): boolean {
  if (!sub) return false
  if (sub.status === 'active') return true
  if (
    (sub.status === 'past_due' || sub.status === 'canceled') &&
    sub.current_period_end &&
    new Date(sub.current_period_end) > new Date()
  ) {
    return true
  }
  return false
}
