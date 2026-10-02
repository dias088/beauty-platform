import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/lib/billing/types'

export type MyProStatus = {
  /** До какого момента оплачен Pro (masters.boost_until), см. lib/billing/pro.ts. */
  proUntil: string | null
  /** Автосписание, если мастер его оформлял. Само по себе Pro не открывает. */
  subscription: Subscription | null
}

/** Pro-статус и подписка текущего мастера. RLS отдаёт только свои строки. */
export async function getMyProStatus(): Promise<MyProStatus | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: master } = await supabase
    .from('masters').select('id, boost_until').eq('profile_id', user.id).single()
  if (!master) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('master_id', master.id)
    .maybeSingle()

  return {
    proUntil: master.boost_until,
    subscription: (data as Subscription | null) ?? null,
  }
}
