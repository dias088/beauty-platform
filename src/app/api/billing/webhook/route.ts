import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/billing/provider'
import { applyBillingEvent } from '@/lib/billing/service'

// Webhook платёжного провайдера. Единственное место, где меняется статус
// подписки. Защита: HMAC-подпись + идемпотентность (в service).
export async function POST(req: Request) {
  const provider = getProvider()
  const rawBody = await req.text()

  // 1. Проверяем подпись — иначе любой смог бы «продлить» себе Pro.
  if (!provider.verifyWebhook(rawBody, req.headers)) {
    console.warn('billing webhook: invalid signature')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // 2. Разбираем событие. Нераспознанное подтверждаем, чтобы не было ретраев.
  const event = provider.parseEvent(rawBody, new URL(req.url))
  if (!event) {
    return NextResponse.json(provider.ackBody('ok'))
  }

  // 3. Применяем (идемпотентно, service_role).
  try {
    const outcome = await applyBillingEvent(event, provider.id)
    if (outcome !== 'ok') console.warn('billing webhook:', event.type, outcome)
    // Отказ имеет смысл только на проверке до списания; после списания
    // подтверждаем получение, иначе провайдер будет слать повторы.
    return NextResponse.json(provider.ackBody(event.type === 'check' ? outcome : 'ok'))
  } catch (e) {
    console.error('billing webhook error:', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
