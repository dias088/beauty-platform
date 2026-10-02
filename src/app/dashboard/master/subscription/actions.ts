'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProvider } from '@/lib/billing/provider'
import { PRO_PRICE_KZT, type CheckoutIntent } from '@/lib/billing/types'
import type { Result } from '@/types/result'

/** Мастер текущего пользователя (через RLS: только свой профиль). */
async function currentMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: master } = await supabase
    .from('masters').select('id').eq('profile_id', user.id).single()
  return master ? { masterId: master.id, email: user.email ?? null } : null
}

/**
 * Готовит оформление Pro с ежемесячным автосписанием и возвращает
 * параметры платёжной формы. Pro включает только webhook после оплаты:
 * ответу браузера «оплачено» не доверяем.
 */
export async function startProCheckoutAction(): Promise<Result<CheckoutIntent>> {
  const me = await currentMaster()
  if (!me) return { success: false, error: 'Войдите как мастер' }

  const provider = getProvider()
  // Подписки пишет только сервер: у мастера на таблицу есть лишь чтение.
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('subscriptions')
    .select('id, status, provider_subscription_id')
    .eq('master_id', me.masterId)
    .maybeSingle()

  if (existing && existing.provider_subscription_id &&
      (existing.status === 'active' || existing.status === 'past_due')) {
    return { success: false, error: 'Подписка уже оформлена' }
  }

  let subscriptionId = existing?.id
  if (existing) {
    const { error } = await admin
      .from('subscriptions')
      .update({ provider: provider.id, amount_kzt: PRO_PRICE_KZT, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { success: false, error: 'Не удалось начать оформление' }
  } else {
    const { data, error } = await admin
      .from('subscriptions')
      .insert({ master_id: me.masterId, status: 'inactive', provider: provider.id, amount_kzt: PRO_PRICE_KZT })
      .select('id')
      .single()
    if (error || !data) return { success: false, error: 'Не удалось начать оформление' }
    subscriptionId = data.id
  }

  const intent = provider.createCheckout({
    masterId: me.masterId,
    subscriptionId: subscriptionId!,
    email: me.email,
    amountKzt: PRO_PRICE_KZT,
    description: 'Beauty Platform Pro, подписка на месяц',
  })
  if (!intent) return { success: false, error: 'Оплата пока не подключена' }
  return { success: true, data: intent }
}

/** Отключает автосписание. Оплаченный период Pro остаётся до конца. */
export async function cancelProSubscriptionAction(): Promise<Result> {
  const me = await currentMaster()
  if (!me) return { success: false, error: 'Войдите как мастер' }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, status, provider_subscription_id')
    .eq('master_id', me.masterId)
    .maybeSingle()

  if (!sub || (sub.status !== 'active' && sub.status !== 'past_due')) {
    return { success: false, error: 'Активной подписки нет' }
  }
  if (!sub.provider_subscription_id) {
    return { success: false, error: 'Подписка ещё оформляется, попробуйте через пару минут' }
  }

  try {
    await getProvider().cancelSubscription(sub.provider_subscription_id)
  } catch (e) {
    console.error('cancel subscription failed:', e)
    return { success: false, error: 'Не удалось отменить, попробуйте позже' }
  }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'canceled', canceled_at: now, updated_at: now })
    .eq('id', sub.id)
  if (error) return { success: false, error: 'Автосписание отключено, но статус не обновился' }

  revalidatePath('/dashboard/master/subscription')
  return { success: true, data: undefined }
}
