import 'server-only'
import crypto from 'node:crypto'
import type { PaymentProvider, BillingEvent } from '../types'

/**
 * TipTop Pay (бывший CloudPayments Казахстан): карты любых банков,
 * Apple Pay / Google Pay, автосписание раз в месяц.
 * Документация: https://developers.tiptoppay.kz/
 *
 * Переменные окружения:
 *   BILLING_PROVIDER=tiptoppay
 *   TIPTOPPAY_PUBLIC_ID   — Public ID терминала (виден в браузере, не секрет)
 *   TIPTOPPAY_API_SECRET  — пароль для API, им же подписаны уведомления
 *
 * Уведомления: в кабинете TipTop Pay для каждого типа указать
 *   https://<домен>/api/billing/webhook?type=check
 *   https://<домен>/api/billing/webhook?type=pay
 *   https://<домен>/api/billing/webhook?type=fail
 *   https://<домен>/api/billing/webhook?type=recurrent
 * Формат тела — application/x-www-form-urlencoded.
 *
 * Сверить на тестовом терминале перед запуском: заголовок подписи
 * и коды ответа на Check. Проверка подписи закрыта по умолчанию:
 * если формат не совпадёт, уведомления будут отклоняться, а не приниматься.
 */

const API_BASE = 'https://api.tiptoppay.kz'
const WIDGET_URL = 'https://widget.tiptoppay.kz/bundles/widget.js'

// Коды ответа на Check (0 — платёж можно проводить).
const CHECK_CODES = { ok: 0, not_found: 11, bad_amount: 12 } as const

function hmacBase64(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64')
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

function decodeForm(rawBody: string): string {
  try {
    return decodeURIComponent(rawBody.replace(/\+/g, ' '))
  } catch {
    return rawBody
  }
}

function num(v: string | null): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const tiptopPayProvider: PaymentProvider = {
  id: 'tiptoppay',

  verifyWebhook(rawBody, headers) {
    const secret = process.env.TIPTOPPAY_API_SECRET
    if (!secret) return false
    const raw = hmacBase64(secret, rawBody)
    const decoded = hmacBase64(secret, decodeForm(rawBody))
    // Content-HMAC — подпись тела как пришло, X-Content-HMAC — раскодированного.
    // X-Api-Sign встречается в новой документации; принимаем любой валидный.
    const candidates: Array<[string, string]> = [
      ['content-hmac', raw],
      ['x-content-hmac', decoded],
      ['x-api-sign', raw],
    ]
    return candidates.some(([name, expected]) => {
      const got = headers.get(name)
      return !!got && safeEqual(got, expected)
    })
  },

  parseEvent(rawBody, url): BillingEvent | null {
    const p = new URLSearchParams(rawBody)
    const type = (url.searchParams.get('type') || '').toLowerCase()
    const accountId = p.get('AccountId') || null
    const subscriptionId = p.get('SubscriptionId') || null
    const currency = p.get('Currency') || 'KZT'

    switch (type) {
      case 'check':
        return { type: 'check', accountId, amountKzt: num(p.get('Amount')), currency }

      case 'pay':
      case 'fail': {
        const tx = p.get('TransactionId')
        if (!tx) return null
        return {
          type: type === 'pay' ? 'payment_succeeded' : 'payment_failed',
          providerPaymentId: `tiptoppay:${tx}`,
          providerSubscriptionId: subscriptionId,
          accountId,
          amountKzt: num(p.get('Amount')),
          currency,
          cardLast4: p.get('CardLastFour') || undefined,
        }
      }

      case 'recurrent': {
        const id = p.get('Id')
        if (!id) return null
        const map: Record<string, 'active' | 'past_due' | 'canceled' | 'expired'> = {
          Active: 'active',
          PastDue: 'past_due',
          Cancelled: 'canceled',
          Rejected: 'canceled',
          Expired: 'expired',
        }
        const status = map[p.get('Status') || '']
        if (!status) return null
        return { type: 'subscription_updated', providerSubscriptionId: id, accountId, status }
      }

      default:
        return null
    }
  },

  ackBody(outcome) {
    return { code: CHECK_CODES[outcome] }
  },

  createCheckout({ masterId, subscriptionId, email, amountKzt, description }) {
    const publicTerminalId = process.env.TIPTOPPAY_PUBLIC_ID
    if (!publicTerminalId || !process.env.TIPTOPPAY_API_SECRET) return null
    return {
      provider: 'tiptoppay',
      scriptUrl: WIDGET_URL,
      params: {
        publicTerminalId,
        description,
        paymentSchema: 'Single',
        currency: 'KZT',
        amount: amountKzt,
        accountId: masterId,
        externalId: subscriptionId,
        ...(email ? { email } : {}),
        // Первое списание сейчас, дальше автоматически раз в месяц.
        recurrent: { interval: 'Month', period: 1, amount: amountKzt },
      },
    }
  },

  async cancelSubscription(providerSubscriptionId) {
    const publicId = process.env.TIPTOPPAY_PUBLIC_ID
    const secret = process.env.TIPTOPPAY_API_SECRET
    if (!publicId || !secret) throw new Error('TipTop Pay is not configured')
    const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${publicId}:${secret}`).toString('base64'),
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
      },
      // Id — исторический формат CloudPayments, SubscriptionId — новый.
      body: JSON.stringify({ Id: providerSubscriptionId, SubscriptionId: providerSubscriptionId }),
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as { Success?: boolean; Message?: string } | null
    if (!res.ok || !json?.Success) {
      throw new Error(`TipTop Pay cancel failed: ${res.status} ${json?.Message ?? ''}`)
    }
  },
}
