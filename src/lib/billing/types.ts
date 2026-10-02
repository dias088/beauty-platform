// Провайдер-независимые типы биллинга. Конкретный провайдер
// (сейчас TipTop Pay) подключается отдельным адаптером в ./providers,
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
// accountId — наш masters.id, который мы сами передаём провайдеру при оформлении.
export type BillingEvent =
  | {
      /** Провайдер спрашивает, можно ли провести платёж (до списания). */
      type: 'check'
      accountId: string | null
      amountKzt: number
      currency: string
    }
  | {
      type: 'payment_succeeded' | 'payment_failed'
      providerPaymentId: string          // для идемпотентности
      providerSubscriptionId: string | null
      accountId: string | null
      amountKzt: number
      currency: string
      cardLast4?: string
    }
  | {
      /** Подписка у провайдера создана или сменила статус. */
      type: 'subscription_updated'
      providerSubscriptionId: string
      accountId: string | null
      status: 'active' | 'past_due' | 'canceled' | 'expired'
    }

/** Итог обработки события; провайдер переводит его в свой формат ответа. */
export type BillingOutcome = 'ok' | 'not_found' | 'bad_amount'

/** Что нужно браузеру, чтобы открыть платёжную форму провайдера. */
export type CheckoutIntent = {
  provider: string
  scriptUrl: string
  params: Record<string, unknown>
}

export interface PaymentProvider {
  readonly id: string
  /** Проверка подписи входящего webhook (HMAC и т.п.). */
  verifyWebhook(rawBody: string, headers: Headers): boolean
  /**
   * Разбор тела webhook в нормализованное событие (null — если не распознано
   * или событие нам не нужно). url — адрес вызова, в нём может быть тип уведомления.
   */
  parseEvent(rawBody: string, url: URL): BillingEvent | null
  /** Тело ответа на webhook в формате провайдера. */
  ackBody(outcome: BillingOutcome): Record<string, unknown>
  /** Параметры платёжной формы для ежемесячной подписки (null — провайдер не настроен). */
  createCheckout(input: {
    masterId: string
    subscriptionId: string
    email: string | null
    amountKzt: number
    description: string
  }): CheckoutIntent | null
  /** Отмена автосписаний у провайдера. */
  cancelSubscription(providerSubscriptionId: string): Promise<void>
}
