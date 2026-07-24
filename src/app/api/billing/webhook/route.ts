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

  // 2. Разбираем событие.
  const event = provider.parseEvent(rawBody)
  if (!event) {
    return NextResponse.json({ error: 'unrecognized event' }, { status: 400 })
  }

  // 3. Применяем (идемпотентно, service_role).
  try {
    const ok = await applyBillingEvent(event)
    if (!ok) {
      // Подписка не найдена — отвечаем 200, чтобы провайдер не долбил ретраями.
      return NextResponse.json({ ok: true, note: 'no matching subscription' })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('billing webhook error:', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
