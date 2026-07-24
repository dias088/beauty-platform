// Провайдер-независимые типы биллинга. Конкретный провайдер
// (CloudPayments / Freedom / ioka) подключается отдельным адаптером,
// реализующим PaymentProvider.

export const PRO_PRICE_KZT = 7990

export type SubscriptionStatus =
  | 'inactive'   // никогда не оформлял / отменена и период истёк
  | 'active'     // оплачено, Pro активен
  | 'past_due'   // списание не прошло, идёт grace-период
  | 'canceled'   // отменена, но оплаченный период ещё идёт
  | 'expired'    // период истёк без оплаты

export type Subscription = {
  id: string
  master_id: string
  status: SubscriptionStatus
  provider: string | null
  provider_subscription_id: string | null
  card_last4: string | null
  amount_kzt: number
  current_period_end: string | null
  canceled_at: string | null
}

// Нормализованное событие webhook от любого провайдера.
export type BillingEvent = {
  type: 'payment_succeeded' | 'payment_failed' | 'subscription_canceled'
  providerPaymentId: string          // для идемпотентности
  providerSubscriptionId: string     // к какой подписке относится
  amountKzt: number
  cardLast4?: string
}

export interface PaymentProvider {
  readonly id: string
  /** Проверка подписи входящего webhook (HMAC и т.п.). */
  verifyWebhook(rawBody: string, headers: Headers): boolean
  /** Разбор тела webhook в нормализованное событие (null — если не распознано). */
  parseEvent(rawBody: string): BillingEvent | null
}
