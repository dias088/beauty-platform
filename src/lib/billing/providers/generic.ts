import 'server-only'
import crypto from 'node:crypto'
import type { PaymentProvider, BillingEvent } from '../types'

/**
 * Провайдер-заглушка для разработки и тестов, с реальной HMAC-проверкой.
 * Формат тела webhook (JSON):
 *   { type, payment_id, subscription_id, account_id, amount, card_last4 }
 * Подпись: base64(HMAC_SHA256(rawBody, BILLING_WEBHOOK_SECRET)) в заголовке
 * `x-billing-signature`. Платёжной формы нет.
 */
export const genericProvider: PaymentProvider = {
  id: 'generic',

  verifyWebhook(rawBody, headers) {
    const secret = process.env.BILLING_WEBHOOK_SECRET
    if (!secret) return false // без секрета не доверяем ничему
    const provided = headers.get('x-billing-signature') || ''
    const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  },

  parseEvent(rawBody): BillingEvent | null {
    try {
      const e = JSON.parse(rawBody)
      const sub = e?.subscription_id ? String(e.subscription_id) : null
      const account = e?.account_id ? String(e.account_id) : null
      if (e?.type === 'payment_succeeded' || e?.type === 'payment_failed') {
        if (!e.payment_id) return null
        return {
          type: e.type,
          providerPaymentId: String(e.payment_id),
          providerSubscriptionId: sub,
          accountId: account,
          amountKzt: Number(e.amount) || 0,
          currency: 'KZT',
          cardLast4: e.card_last4 ? String(e.card_last4) : undefined,
        }
      }
      if (e?.type === 'subscription_canceled' && sub) {
        return { type: 'subscription_updated', providerSubscriptionId: sub, accountId: account, status: 'canceled' }
      }
      return null
    } catch {
      return null
    }
  },

  ackBody(outcome) {
    return { ok: true, outcome }
  },

  createCheckout() {
    return null
  },

  async cancelSubscription() {
    // Внешней системы нет: статус в базе меняет сам сервис.
  },
}
