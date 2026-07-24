import 'server-only'
import { addMonths } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BillingEvent } from './types'

/**
 * Применяет нормализованное событие webhook к подписке.
 * Работает через service_role (обходит RLS). Идемпотентно: повторный
 * webhook с тем же provider_payment_id игнорируется.
 * Возвращает true, если событие обработано (или уже было обработано).
 */
export async function applyBillingEvent(event: BillingEvent): Promise<boolean> {
  const admin = createAdminClient()

  // Находим подписку по id у провайдера.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, master_id, current_period_end')
    .eq('provider_subscription_id', event.providerSubscriptionId)
    .single()

  if (!sub) return false
  const s = sub as any

  // Идемпотентность: пробуем записать платёж. Дубль provider_payment_id
  // упрётся в unique-констрейнт → значит уже обработано.
  if (event.type === 'payment_succeeded' || event.type === 'payment_failed') {
    const { error: payErr } = await admin.from('subscription_payments').insert({
      subscription_id: s.id,
      master_id: s.master_id,
      provider: 'generic',
      provider_payment_id: event.providerPaymentId,
      amount_kzt: event.amountKzt,
      status: event.type === 'payment_succeeded' ? 'success' : 'failed',
      raw_event: event as any,
    })
    // 23505 = unique_violation → уже обрабатывали, выходим успешно.
    if (payErr && (payErr as any).code === '23505') return true
    if (payErr) throw payErr
  }

  if (event.type === 'payment_succeeded') {
    // Продлеваем на месяц от текущего конца периода (или от now, если истёк).
    const base = s.current_period_end && new Date(s.current_period_end) > new Date()
      ? new Date(s.current_period_end)
      : new Date()
    await admin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: addMonths(base, 1).toISOString(),
        card_last4: event.cardLast4 ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', s.id)
    return true
  }

  if (event.type === 'payment_failed') {
    // Не прошло списание → past_due (Pro ещё жив до конца оплаченного периода).
    await admin
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('id', s.id)
    return true
  }

  if (event.type === 'subscription_canceled') {
    await admin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', s.id)
    return true
  }

  return false
}
