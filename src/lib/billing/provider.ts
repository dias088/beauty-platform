import 'server-only'
import type { PaymentProvider } from './types'
import { genericProvider } from './providers/generic'
import { tiptopPayProvider } from './providers/tiptoppay'

/**
 * Активный платёжный провайдер. BILLING_PROVIDER=tiptoppay включает TipTop Pay;
 * без переменной работает заглушка (оплаты нет, кнопка показывает «скоро»).
 * Сменить провайдера = добавить адаптер в ./providers и ветку здесь.
 */
export function getProvider(): PaymentProvider {
  switch (process.env.BILLING_PROVIDER) {
    case 'tiptoppay': return tiptopPayProvider
    default: return genericProvider
  }
}

/** Можно ли сейчас оформить подписку (провайдер выбран и ключи заданы). */
export function isCheckoutEnabled(): boolean {
  switch (process.env.BILLING_PROVIDER) {
    case 'tiptoppay': return !!process.env.TIPTOPPAY_PUBLIC_ID && !!process.env.TIPTOPPAY_API_SECRET
    default: return false
  }
}
