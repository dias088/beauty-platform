'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getMasterSlots, type Slot } from '@/lib/queries/slots'
import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const FROM = 'Beauty Platform <bookings@beauty-platform.kz>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function sendBookingCreatedEmails(bookingId: string, clientEmail: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const admin = createAdminClient()

    const { data: booking } = await admin
      .from('bookings')
      .select('service_name_snapshot, starts_at, master_id, masters!inner(profile_id, profiles!inner(full_name))')
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const master = booking.masters as any
    const masterProfileId: string = master.profile_id
    const masterName: string = master.profiles.full_name
    const serviceName: string = booking.service_name_snapshot
    const dateTime = format(parseISO(booking.starts_at), "d MMMM yyyy 'в' HH:mm", { locale: ru })

    const { data: masterAuth } = await admin.auth.admin.getUserById(masterProfileId)
    const masterEmail = masterAuth?.user?.email

    await Promise.all([
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
      resend.emails.send({
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
  } catch (err) {
    console.error('Email send failed (non-blocking):', err)
  }
}

const bookingSchema = z.object({
  master_id: z.string().uuid(),
  service_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  client_notes: z.string().max(500).optional(),
})

export async function createBookingAction(
  input: z.infer<typeof bookingSchema>
): Promise<Result<{ id: string }>> {
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Неверные данные' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите в аккаунт' }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('create_booking_atomic', {
      p_client_id: user.id,
      p_master_id: parsed.data.master_id,
      p_service_id: parsed.data.service_id,
      p_slot_id: parsed.data.slot_id,
      p_client_notes: parsed.data.client_notes ?? null,
    })

    if (error) {
      if (error.message.includes('slot_already_booked')) {
        return { success: false, error: 'Этот слот уже занят, выберите другое время' }
      }
      if (error.message.includes('slot_in_past')) {
        return { success: false, error: 'Нельзя записаться на прошедшее время' }
      }
      if (error.message.includes('service_not_found')) {
        return { success: false, error: 'Услуга не найдена' }
      }
      return { success: false, error: 'Не удалось создать запись. Попробуйте ещё раз.' }
    }

    revalidatePath(`/masters/${parsed.data.master_id}`)
    revalidatePath('/dashboard/client')

    // Отправляем email асинхронно, не блокируем ответ
    sendBookingCreatedEmails(data as string, user.email!)

    return { success: true, data: { id: data as string } }
  } catch (err) {
    console.error('Booking error:', err)
    return { success: false, error: 'Ошибка при создании записи' }
  }
}

export async function getSlotsAction(masterId: string): Promise<Slot[]> {
  return getMasterSlots(masterId)
}

// ─── Превью скидки для клиента ────────────────────────────────────────────────
// Вызывается при выборе услуги в диалоге бронирования.
// Проверяет Beauty Score текущего клиента и настройки скидок мастера.

export async function getDiscountPreviewAction(
  masterId: string,
  serviceId: string
): Promise<{ discount_pct: number; final_price: number; original_price: number } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Параллельно загружаем: цену услуги, Beauty Score клиента, настройки скидок мастера
  const [serviceRes, scoreRes, discountRes] = await Promise.all([
    supabase
      .from('services')
      .select('price_kzt')
      .eq('id', serviceId)
      .eq('master_id', masterId)
      .single(),
    supabase
      .from('client_scores')
      .select('level')
      .eq('client_id', user.id)
      .single(),
    supabase
      .from('master_score_discounts')
      .select('verified_discount, trusted_discount')
      .eq('master_id', masterId)
      .single(),
  ])

  if (!serviceRes.data) return null

  const originalPrice = serviceRes.data.price_kzt
  const level         = scoreRes.data?.level ?? 'new'
  const cfg           = discountRes.data

  let discountPct = 0

  if (cfg) {
    if (level === 'trusted' && cfg.trusted_discount > 0) {
      discountPct = cfg.trusted_discount
    } else if (level === 'verified' && cfg.verified_discount > 0) {
      discountPct = cfg.verified_discount
    }
  }

  if (discountPct === 0) return null

  const finalPrice = Math.round(originalPrice * (100 - discountPct) / 100)

  return {
    discount_pct:   discountPct,
    final_price:    finalPrice,
    original_price: originalPrice,
  }
}
