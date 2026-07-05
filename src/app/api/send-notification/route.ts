import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FROM = 'Beauty Platform <bookings@beauty-platform.kz>'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const body = await request.json()
    const { type, clientEmail, masterEmail, masterName, serviceName, dateTime } = body

    if (!type) {
      return Response.json({ error: 'Missing type' }, { status: 400 })
    }

    if (type === 'booking_created') {
      await Promise.all([
        // Мастеру
        masterEmail && resend.emails.send({
          from: FROM,
          to: masterEmail,
          subject: '💄 Новая запись на Beauty Platform',
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#7c3aed">Новая запись!</h2>
              <p>Клиент записался на <strong>${serviceName}</strong></p>
              <p><strong>Время:</strong> ${dateTime}</p>
              <div style="margin-top:24px">
                <a href="${APP_URL}/dashboard/master"
                  style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
                  Открыть дашборд
                </a>
              </div>
            </div>
          `,
        }),
        // Клиенту
        clientEmail && resend.emails.send({
          from: FROM,
          to: clientEmail,
          subject: `✅ Запись создана — ${masterName}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#7c3aed">Запись создана!</h2>
              <p>Вы записались к <strong>${masterName}</strong></p>
              <p>Услуга: <strong>${serviceName}</strong></p>
              <p>Время: <strong>${dateTime}</strong></p>
              <p style="color:#6b7280;font-size:14px">Мастер подтвердит запись в течение часа.</p>
              <div style="margin-top:24px">
                <a href="${APP_URL}/dashboard/client"
                  style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
                  Мой кабинет
                </a>
              </div>
            </div>
          `,
        }),
      ])
    }

    if (type === 'booking_confirmed') {
      await resend.emails.send({
        from: FROM,
        to: clientEmail,
        subject: '✅ Мастер подтвердил вашу запись',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#16a34a">Запись подтверждена!</h2>
            <p>Мастер <strong>${masterName}</strong> подтвердил вашу запись</p>
            <p>Услуга: <strong>${serviceName}</strong></p>
            <p>Время: <strong>${dateTime}</strong></p>
            <p>До встречи! 💄</p>
          </div>
        `,
      })
    }

    if (type === 'reminder') {
      await resend.emails.send({
        from: FROM,
        to: clientEmail,
        subject: '⏰ Напоминание о записи завтра',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#d97706">Напоминание!</h2>
            <p>Завтра у вас запись к <strong>${masterName}</strong></p>
            <p>Услуга: <strong>${serviceName}</strong></p>
            <p>Время: <strong>${dateTime}</strong></p>
            <div style="margin-top:24px">
              <a href="${APP_URL}/dashboard/client"
                style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
                Мой кабинет
              </a>
            </div>
          </div>
        `,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
