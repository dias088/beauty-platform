import 'server-only'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const FROM = 'Beauty Platform <bookings@beauty-platform.kz>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type Ctx = { clientEmail: string; masterName: string; serviceName: string; dateTime: string }

/** Данные для письма клиенту: email клиента, имя мастера, услуга, время. */
async function getBookingContext(bookingId: string): Promise<Ctx | null> {
  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select(
      'client_id, service_name_snapshot, starts_at, masters!inner(profiles!masters_profile_id_fkey!inner(full_name))'
    )
    .eq('id', bookingId)
    .single()

  if (!booking) return null
  const b = booking as any

  // Email клиента лежит в auth.users — берём через admin
  const { data: clientAuth } = await admin.auth.admin.getUserById(b.client_id)
  const clientEmail = clientAuth?.user?.email
  if (!clientEmail) return null

  return {
    clientEmail,
    masterName: b.masters?.profiles?.full_name ?? 'Мастер',
    serviceName: b.service_name_snapshot ?? 'Услуга',
    dateTime: format(parseISO(b.starts_at), "d MMMM yyyy 'в' HH:mm", { locale: ru }),
  }
}

function shell(inner: string) {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#0d0d0f">
      ${inner}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #eee;color:#9ca3af;font-size:12px">
        Beauty.kz — онлайн-запись к мастерам красоты в Астане
      </div>
    </div>`
}

function button(href: string, label: string) {
  return `<div style="margin-top:24px">
    <a href="${href}" style="background:#FF2D78;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${label}</a>
  </div>`
}

/** Клиенту: мастер подтвердил запись. Не бросает — ошибки только логирует. */
export async function sendBookingConfirmedEmail(bookingId: string): Promise<void> {
  try {
    const ctx = await getBookingContext(bookingId)
    if (!ctx || !process.env.RESEND_API_KEY) return
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to: ctx.clientEmail,
      subject: 'Мастер подтвердил вашу запись',
      html: shell(`
        <h2 style="color:#16a34a;margin:0 0 12px">Запись подтверждена</h2>
        <p>Мастер <strong>${ctx.masterName}</strong> подтвердил вашу запись.</p>
        <p>Услуга: <strong>${ctx.serviceName}</strong><br/>Время: <strong>${ctx.dateTime}</strong></p>
        <p style="color:#6b7280;font-size:14px">До встречи! Если планы изменятся — отмените запись в кабинете заранее.</p>
        ${button(`${APP_URL}/dashboard/client`, 'Мои записи')}
      `),
    })
  } catch (e) {
    console.error('sendBookingConfirmedEmail failed:', e)
  }
}

/** Клиенту: запись отменена мастером. */
export async function sendBookingCancelledEmail(bookingId: string): Promise<void> {
  try {
    const ctx = await getBookingContext(bookingId)
    if (!ctx || !process.env.RESEND_API_KEY) return
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to: ctx.clientEmail,
      subject: 'Запись отменена',
      html: shell(`
        <h2 style="color:#ef4444;margin:0 0 12px">Запись отменена</h2>
        <p>К сожалению, мастер <strong>${ctx.masterName}</strong> отменил запись.</p>
        <p>Услуга: <strong>${ctx.serviceName}</strong><br/>Время: <strong>${ctx.dateTime}</strong></p>
        <p style="color:#6b7280;font-size:14px">Вы можете выбрать другое время или другого мастера в каталоге.</p>
        ${button(`${APP_URL}/`, 'Найти мастера')}
      `),
    })
  } catch (e) {
    console.error('sendBookingCancelledEmail failed:', e)
  }
}
