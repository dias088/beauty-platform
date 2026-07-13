'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'

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
      instagram_handle: instagram_handle || null,
    })
    .eq('id', master.id)

  if (error) return { success: false, error: 'Не удалось обновить профиль' }

  revalidatePath('/dashboard/master/profile')
  return { success: true, data: undefined }
}

