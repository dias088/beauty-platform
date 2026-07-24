import 'server-only'
import crypto from 'node:crypto'
import type { PaymentProvider, BillingEvent } from './types'

/**
 * Дефолтный провайдер-заглушка с реальной HMAC-проверкой подписи.
 * Формат тела webhook (JSON):
 *   { type, payment_id, subscription_id, amount, card_last4 }
 * Подпись: base64(HMAC_SHA256(rawBody, BILLING_WEBHOOK_SECRET)) в заголовке
 * `x-billing-signature`. Когда выберем реального провайдера
 * (CloudPayments/Freedom/ioka) — добавим его адаптер и переключим здесь.
 */
const genericProvider: PaymentProvider = {
  id: 'generic',

  verifyWebhook(rawBody, headers) {
    const secret = process.env.BILLING_WEBHOOK_SECRET
    if (!secret) return false // без секрета не доверяем ничему
    const provided = headers.get('x-billing-signature') || ''
    const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
    // Сравнение с защитой от timing-атак.
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  },

  parseEvent(rawBody): BillingEvent | null {
    try {
      const e = JSON.parse(rawBody)
      if (!e?.payment_id || !e?.subscription_id || !e?.type) return null
      const typeMap: Record<string, BillingEvent['type']> = {
        payment_succeeded: 'payment_succeeded',
        payment_failed: 'payment_failed',
        subscription_canceled: 'subscription_canceled',
      }
      const type = typeMap[e.type]
      if (!type) return null
      return {
        type,
        providerPaymentId: String(e.payment_id),
        providerSubscriptionId: String(e.subscription_id),
        amountKzt: Number(e.amount) || 0,
        cardLast4: e.card_last4 ? String(e.card_last4) : undefined,
      }
    } catch {
      return null
    }
  },
}

/** Возвращает активный платёжный провайдер. */
export function getProvider(): PaymentProvider {
  // Позже: switch по process.env.BILLING_PROVIDER → cloudpayments/freedom/ioka.
  return genericProvider
}
