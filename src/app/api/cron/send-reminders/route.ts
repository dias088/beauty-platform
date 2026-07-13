import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Обычный клиент — для чтения данных под RLS-политиками недостаточно,
  // т.к. у cron-запроса нет сессии пользователя. Используем admin-клиент
  // (service role) и для чтения bookings, и для auth.admin.getUserById().
  const supabase = createAdminClient()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Записи, которые начнутся через 23-25 часов
  const from = new Date(Date.now() + 23 * 60 * 60 * 1000)
  const to   = new Date(Date.now() + 25 * 60 * 60 * 1000)

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
    .lte('starts_at', to.toISOString())

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
