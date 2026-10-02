import 'server-only'
import { addMonths } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import type { BillingEvent, BillingOutcome } from './types'
import { extendProUntil } from './pro'

type Admin = ReturnType<typeof createAdminClient>
type SubRow = {
  id: string
  master_id: string
  status: string
  amount_kzt: number
  current_period_end: string | null
  provider_subscription_id: string | null
}

const SUB_COLUMNS = 'id, master_id, status, amount_kzt, current_period_end, provider_subscription_id'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Подписка по id у провайдера, иначе по нашему masters.id (accountId). */
async function findSubscription(
  admin: Admin,
  providerSubscriptionId: string | null,
  accountId: string | null,
): Promise<SubRow | null> {
  if (providerSubscriptionId) {
    const { data } = await admin
      .from('subscriptions').select(SUB_COLUMNS)
      .eq('provider_subscription_id', providerSubscriptionId)
      .maybeSingle()
    if (data) return data as SubRow
  }
  if (accountId && UUID_RE.test(accountId)) {
    const { data } = await admin
      .from('subscriptions').select(SUB_COLUMNS)
      .eq('master_id', accountId)
      .maybeSingle()
    if (data) return data as SubRow
  }
  return null
}

/** Сумма совпадает с ценой подписки: параметры формы приходят из браузера, им не верим. */
function amountMatches(sub: SubRow, amountKzt: number, currency: string): boolean {
  return currency.toUpperCase() === 'KZT' && amountKzt >= sub.amount_kzt
}

/**
 * Применяет нормализованное событие webhook к подписке.
 * Работает через service_role (обходит RLS). Идемпотентно: повторный
 * webhook с тем же provider_payment_id не продлевает Pro второй раз.
 */
export async function applyBillingEvent(event: BillingEvent, providerId: string): Promise<BillingOutcome> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  if (event.type === 'check') {
    const sub = await findSubscription(admin, null, event.accountId)
    if (!sub) return 'not_found'
    return amountMatches(sub, event.amountKzt, event.currency) ? 'ok' : 'bad_amount'
  }

  if (event.type === 'subscription_updated') {
    let sub = await findSubscription(admin, event.providerSubscriptionId, null)
    // Новая подписка у провайдера: привязываем её id к записи мастера.
    if (!sub && event.status === 'active') {
      sub = await findSubscription(admin, null, event.accountId)
    }
    if (!sub) return 'not_found'

    const patch: Database['public']['Tables']['subscriptions']['Update'] = {
      provider_subscription_id: event.providerSubscriptionId,
      updated_at: now,
    }
    if (event.status === 'past_due') patch.status = 'past_due'
    if (event.status === 'expired') patch.status = 'expired'
    if (event.status === 'canceled') {
      patch.status = 'canceled'
      patch.canceled_at = now
    }
    const { error } = await admin.from('subscriptions').update(patch).eq('id', sub.id)
    if (error) throw error
    return 'ok'
  }

  // payment_succeeded / payment_failed
  const sub = await findSubscription(admin, event.providerSubscriptionId, event.accountId)
  if (!sub) return 'not_found'

  // Идемпотентность: пробуем записать платёж. Дубль provider_payment_id
  // упрётся в unique-констрейнт → значит уже обработано.
  const { error: payErr } = await admin.from('subscription_payments').insert({
    subscription_id: sub.id,
    master_id: sub.master_id,
    provider: providerId,
    provider_payment_id: event.providerPaymentId,
    amount_kzt: event.amountKzt,
    status: event.type === 'payment_succeeded' ? 'success' : 'failed',
    raw_event: event,
  })
  // 23505 = unique_violation → уже обрабатывали. Pro всё равно досинхронизируем:
  // если прошлый вызов упал после записи платежа, повтор webhook это починит.
  if (payErr && payErr.code === '23505') {
    if (event.type === 'payment_succeeded' && sub.current_period_end) {
      await syncProUntil(admin, sub.master_id, new Date(sub.current_period_end))
    }
    return 'ok'
  }
  if (payErr) throw payErr

  if (event.type === 'payment_failed') {
    // Не прошло очередное списание → past_due (Pro жив до конца оплаченного периода).
    // Неудачная первая попытка в форме оплаты статус не меняет.
    if (sub.status === 'active') {
      const { error } = await admin
        .from('subscriptions').update({ status: 'past_due', updated_at: now }).eq('id', sub.id)
      if (error) throw error
    }
    return 'ok'
  }

  if (!amountMatches(sub, event.amountKzt, event.currency)) {
    // Платёж записан для разбора, но Pro за неполную сумму не продлеваем.
    console.error('billing: payment amount below subscription price', {
      subscription: sub.id, amount: event.amountKzt, currency: event.currency,
    })
    return 'bad_amount'
  }

  // Продлеваем на месяц от текущего конца периода (или от now, если истёк).
  const base = sub.current_period_end && new Date(sub.current_period_end) > new Date()
    ? new Date(sub.current_period_end)
    : new Date()
  const periodEnd = addMonths(base, 1)
  const { error: subErr } = await admin
    .from('subscriptions')
    .update({
      status: 'active',
      provider: providerId,
      ...(event.providerSubscriptionId ? { provider_subscription_id: event.providerSubscriptionId } : {}),
      current_period_end: periodEnd.toISOString(),
      card_last4: event.cardLast4 ?? undefined,
      canceled_at: null,
      updated_at: now,
    })
    .eq('id', sub.id)
  if (subErr) throw subErr

  await syncProUntil(admin, sub.master_id, periodEnd)
  return 'ok'
}

/**
 * Pro открывается только через masters.boost_until (см. ./pro.ts):
 * продлеваем его до конца оплаченного периода, не сокращая разовый буст.
 * Идемпотентно: повторный вызов с той же датой ничего не меняет.
 */
async function syncProUntil(admin: Admin, masterId: string, until: Date): Promise<void> {
  const { data: m } = await admin
    .from('masters').select('boost_until').eq('id', masterId).single()
  const { error } = await admin
    .from('masters')
    .update({ boost_until: extendProUntil(m?.boost_until, until) })
    .eq('id', masterId)
  if (error) throw error
}
