import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingReminderEmail } from '@/lib/email/booking-emails'

export async function GET(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Обычный клиент — для чтения данных под RLS-политиками недостаточно,
  // т.к. у cron-запроса нет сессии пользователя. Используем admin-клиент
  // (service role) и для чтения bookings, и для auth.admin.getUserById().
  const supabase = createAdminClient()

  // Записи, которые начнутся через 23-25 часов
  const from = new Date(Date.now() + 23 * 60 * 60 * 1000)
  const to   = new Date(Date.now() + 25 * 60 * 60 * 1000)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'confirmed')
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())

  if (!bookings?.length) {
    return Response.json({ sent: 0 })
  }

  // Получатель и текст письма берутся из самой записи на сервере,
  // без промежуточного HTTP-роута.
  let sent = 0
  for (const booking of bookings) {
    if (await sendBookingReminderEmail(booking.id)) sent++
  }

  return Response.json({ sent })
}
