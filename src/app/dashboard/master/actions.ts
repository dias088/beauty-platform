'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/lib/email/booking-emails'

export async function confirmBookingAction(bookingId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('master_id, masters!inner(profile_id)')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', status_changed_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { success: false, error: 'Не удалось подтвердить' }

  // Письмо клиенту — после ответа, чтобы не тормозить действие
  after(() => sendBookingConfirmedEmail(bookingId))

  revalidatePath('/dashboard/master')
  return { success: true, data: undefined }
}

export async function completeBookingAction(bookingId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('master_id, starts_at, masters!inner(profile_id)')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  if (new Date(booking.starts_at) > new Date()) {
    return { success: false, error: 'Запись ещё не наступила' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed', status_changed_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { success: false, error: 'Не удалось завершить' }

  revalidatePath('/dashboard/master')
  return { success: true, data: undefined }
}

export async function markNoShowAction(bookingId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('master_id, starts_at, masters!masters_profile_id_fkey!inner(profile_id)')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  if (new Date(booking.starts_at) > new Date()) {
    return { success: false, error: 'Запись ещё не наступила' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'no_show', status_changed_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { success: false, error: 'Не удалось отметить' }

  revalidatePath('/dashboard/master')
  return { success: true, data: undefined }
}

export async function cancelBookingAction(bookingId: string, reason?: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('slot_id, master_id, masters!inner(profile_id)')
    .eq('id', bookingId)
    .single()

  if (!booking || (booking.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  const { error: bookingError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled_by_master',
      status_changed_at: new Date().toISOString(),
      master_notes: reason,
    })
    .eq('id', bookingId)

  if (bookingError) return { success: false, error: 'Не удалось отменить' }

  await supabase.from('slots').update({ is_booked: false }).eq('id', booking.slot_id)

  // Письмо клиенту об отмене — после ответа
  after(() => sendBookingCancelledEmail(bookingId))

  revalidatePath('/dashboard/master')
  return { success: true, data: undefined }
}

/**
 * Создаёт слоты из ГОТОВЫХ ISO-меток времени, посчитанных на клиенте.
 * Важно: время считается в браузере мастера (его часовой пояс, Астана),
 * поэтому сюда приходят корректные UTC-таймстемпы и вставляются как есть.
 * Раньше время «расшивалось» в строки и пересобиралось на сервере (UTC) —
 * из-за этого 09:00 превращалось в 14:00. Теперь этого нет.
 * Пропускает прошедшие и пересекающиеся с существующими слоты.
 */
export async function createSlotsAction(
  candidates: { starts: string; ends: string }[]
): Promise<Result<{ created: number; skipped: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { success: false, error: 'Не найден профиль мастера' }

  const now = Date.now()
  const future = candidates.filter(c => new Date(c.starts).getTime() > now)
  if (future.length === 0) return { success: false, error: 'Все слоты уже в прошлом' }

  // Диапазон кандидатов, чтобы подтянуть пересекающиеся существующие слоты
  const minStart = future.reduce((m, c) => (c.starts < m ? c.starts : m), future[0].starts)
  const maxEnd = future.reduce((m, c) => (c.ends > m ? c.ends : m), future[0].ends)

  const { data: existing } = await supabase
    .from('slots')
    .select('starts_at, ends_at')
    .eq('master_id', master.id)
    .lt('starts_at', maxEnd)
    .gt('ends_at', minStart)

  const overlaps = (aStart: number, aEnd: number) =>
    (existing ?? []).some(e => {
      const es = new Date(e.starts_at).getTime()
      const ee = new Date(e.ends_at).getTime()
      return aStart < ee && es < aEnd // пересечение интервалов
    })

  const rows = future
    .filter(c => !overlaps(new Date(c.starts).getTime(), new Date(c.ends).getTime()))
    .map(c => ({
      master_id: master.id,
      starts_at: c.starts,
      ends_at: c.ends,
      is_booked: false,
    }))

  if (rows.length === 0) return { success: false, error: 'Такие слоты уже существуют' }

  const { error } = await supabase.from('slots').insert(rows)
  if (error) return { success: false, error: 'Не удалось создать слоты' }

  revalidatePath('/dashboard/master/schedule')
  return { success: true, data: { created: rows.length, skipped: future.length - rows.length } }
}

export type ScheduleTemplateDay = {
  weekday: number
  enabled: boolean
  startTime: string
  endTime: string
  slotDuration: number
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function getMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

async function getCurrentMasterId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Войдите снова' as const }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { supabase, error: 'Профиль мастера не найден' as const }
  return { supabase, masterId: master.id }
}

export async function getScheduleTemplateAction(): Promise<Result<ScheduleTemplateDay[]>> {
  const current = await getCurrentMasterId()
  if ('error' in current) return { success: false, error: current.error }

  // The table is introduced by migration 10. The generated Supabase types are
  // not regenerated in this repository, so this isolated cast keeps the app typed.
  const templates = current.supabase.from('master_schedule_templates' as any) as any
  const { data, error } = await templates
    .select('weekday, enabled, start_time, end_time, slot_duration_minutes')
    .eq('master_id', current.masterId)
    .order('weekday')

  if (error) return { success: false, error: 'Не удалось загрузить шаблон расписания' }

  return {
    success: true,
    data: (data ?? []).map((day: any) => ({
      weekday: day.weekday,
      enabled: day.enabled,
      startTime: day.start_time.slice(0, 5),
      endTime: day.end_time.slice(0, 5),
      slotDuration: day.slot_duration_minutes,
    })),
  }
}

export async function saveScheduleTemplateAction(
  days: ScheduleTemplateDay[]
): Promise<Result> {
  if (!Array.isArray(days) || days.length !== 7 || new Set(days.map(day => day.weekday)).size !== 7) {
    return { success: false, error: 'Шаблон должен содержать настройки для всех дней недели' }
  }

  for (const day of days) {
    if (!Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
      return { success: false, error: 'Некорректный день недели' }
    }
    if (!TIME_PATTERN.test(day.startTime) || !TIME_PATTERN.test(day.endTime)) {
      return { success: false, error: 'Укажите корректное время работы' }
    }
    if (!Number.isInteger(day.slotDuration) || day.slotDuration < 15 || day.slotDuration > 480) {
      return { success: false, error: 'Длительность слота должна быть от 15 до 480 минут' }
    }
    if (day.enabled && getMinutes(day.endTime) <= getMinutes(day.startTime)) {
      return { success: false, error: 'Время окончания должно быть позже времени начала' }
    }
  }

  const current = await getCurrentMasterId()
  if ('error' in current) return { success: false, error: current.error }

  const templates = current.supabase.from('master_schedule_templates' as any) as any
  const { error } = await templates.upsert(
    days.map(day => ({
      master_id: current.masterId,
      weekday: day.weekday,
      enabled: day.enabled,
      start_time: day.startTime,
      end_time: day.endTime,
      slot_duration_minutes: day.slotDuration,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'master_id,weekday' }
  )

  if (error) return { success: false, error: 'Не удалось сохранить шаблон расписания' }

  revalidatePath('/dashboard/master/schedule')
  return { success: true, data: undefined }
}

export async function deleteSlotAction(slotId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', slotId)

  if (error) return { success: false, error: 'Не удалось удалить слот' }

  revalidatePath('/dashboard/master/schedule')
  return { success: true, data: undefined }
}

export async function createServiceAction(
  name: string,
  category: string,
  price_kzt: number,
  duration_minutes: number,
  description?: string
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { success: false, error: 'Не найден профиль мастера' }

  const { error } = await supabase
    .from('services')
    .insert({
      master_id: master.id,
      name,
      category: category as 'nail' | 'lash' | 'brow' | 'hair' | 'makeup' | 'cosmetology',
      price_kzt,
      duration_minutes,
      description: description || null,
    })

  if (error) return { success: false, error: 'Не удалось создать услугу' }

  revalidatePath('/dashboard/master/services')
  return { success: true, data: undefined }
}

export async function updateServiceAction(
  serviceId: string,
  name: string,
  category: string,
  price_kzt: number,
  duration_minutes: number,
  description?: string
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { error } = await supabase
    .from('services')
    .update({
      name,
      category: category as 'nail' | 'lash' | 'brow' | 'hair' | 'makeup' | 'cosmetology',
      price_kzt,
      duration_minutes,
      description: description || null,
    })
    .eq('id', serviceId)

  if (error) return { success: false, error: 'Не удалось обновить услугу' }

  revalidatePath('/dashboard/master/services')
  return { success: true, data: undefined }
}

export async function deleteServiceAction(serviceId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) return { success: false, error: 'Не удалось удалить услугу' }

  revalidatePath('/dashboard/master/services')
  return { success: true, data: undefined }
}

export async function requestBoostAction(plan: '7d' | '30d'): Promise<Result<{ kaspi_number: string; amount: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase
    .from('masters')
    .select('id, profiles!masters_profile_id_fkey!inner(full_name)')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { success: false, error: 'Не найден профиль мастера' }

  const PLANS = {
    '7d':  { label: '7 дней',  amount: 2990 },
    '30d': { label: '30 дней', amount: 7990 },
  }
  const chosen = PLANS[plan]

  // Отправляем уведомление администратору
  try {
    const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Beauty Platform <bookings@beauty-platform.kz>',
      to: 'medetsovetov09@gmail.com',
      subject: `Запрос на буст — ${(master.profiles as any).full_name}`,
      html: `
        <div style="font-family:sans-serif">
          <h2>Новый запрос на буст</h2>
          <p><strong>Мастер:</strong> ${(master.profiles as any).full_name}</p>
          <p><strong>Master ID:</strong> ${master.id}</p>
          <p><strong>Тариф:</strong> ${chosen.label} — ${chosen.amount.toLocaleString('ru')} ₸</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <hr/>
          <p>После получения оплаты установите в Supabase:<br/>
          <code>UPDATE masters SET boost_until = NOW() + INTERVAL '${plan === '7d' ? '7 days' : '30 days'}' WHERE id = '${master.id}';</code></p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Boost notification failed:', err)
  }

  return { success: true, data: { kaspi_number: '+7 777 123 45 67', amount: chosen.amount } }
}

export async function updateLocationAction(
  address: string,
  lat: number,
  lng: number
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { error } = await supabase
    .from('masters')
    .update({ address, lat, lng })
    .eq('profile_id', user.id)

  if (error) return { success: false, error: 'Не удалось обновить локацию' }

  revalidatePath('/dashboard/master/profile')
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function updateProfileAction(
  bio: string,
  categories: string[],
  instagram_handle?: string
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { success: false, error: 'Не найден профиль' }

  const { error } = await supabase
    .from('masters')
    .update({
      bio,
      categories: categories as ('nail' | 'lash' | 'brow' | 'hair' | 'makeup' | 'cosmetology')[],
      instagram_handle: instagram_handle?.replace(/^@+/, '').trim() || null,
    })
    .eq('id', master.id)

  if (error) return { success: false, error: 'Не удалось обновить профиль' }

  revalidatePath('/dashboard/master/profile')
  return { success: true, data: undefined }
}
