import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron передаёт секрет в заголовке `Authorization: Bearer <CRON_SECRET>`.
// Без заданного CRON_SECRET роут закрыт для всех, иначе подошёл бы `Bearer undefined`.
function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const received = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

// Астана живёт по UTC+5 круглый год (без перехода на летнее время).
const ASTANA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// Границы завтрашнего дня по времени Астаны, в UTC: [начало, конец).
function tomorrowInAstana(now: Date): { from: Date; to: Date } {
  const local = new Date(now.getTime() + ASTANA_UTC_OFFSET_MS)
  const startMs =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1) - ASTANA_UTC_OFFSET_MS
  return { from: new Date(startMs), to: new Date(startMs + DAY_MS) }
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Обычный клиент — для чтения данных под RLS-политиками недостаточно,
  // т.к. у cron-запроса нет сессии пользователя. Используем admin-клиент
  // (service role) и для чтения bookings, и для auth.admin.getUserById().
  const supabase = createAdminClient()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Крон запускается раз в сутки, поэтому берём все записи на завтра,
  // а не узкое окно «через 23-25 часов».
  const { from, to } = tomorrowInAstana(new Date())

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      starts_at,
      service_name_snapshot,
      profiles!bookings_client_id_fkey (id, full_name),
      masters!inner (
        profile_id,
        profiles!masters_profile_id_fkey!inner (full_name)
      )
    `)
    .eq('status', 'confirmed')
    .gte('starts_at', from.toISOString())
    .lt('starts_at', to.toISOString())

  if (!bookings?.length) {
    return Response.json({ sent: 0 })
  }

  let sent = 0
  for (const booking of bookings) {
    const clientId = (booking.profiles as any).id
    const { data: authUser } = await supabase.auth.admin.getUserById(clientId)
    const clientEmail = authUser?.user?.email

    if (!clientEmail) continue

    await fetch(`${APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reminder',
        clientEmail,
        masterName: (booking.masters as any).profiles.full_name,
        serviceName: booking.service_name_snapshot,
        dateTime: new Date(booking.starts_at).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' }),
      }),
    })
    sent++
  }

  return Response.json({ sent })
}
