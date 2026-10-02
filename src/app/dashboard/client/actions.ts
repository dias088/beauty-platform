'use server'

import { createClient } from '@/lib/supabase/server'
import { checkContent } from '@/lib/moderation'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MEDIA_URL_RE = /\/storage\/v1\/object\/public\/media\//

const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
  photos: z.array(z.string().url().regex(MEDIA_URL_RE)).max(3).optional(),
})

export async function addReviewAction(input: z.infer<typeof reviewSchema>): Promise<Result> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Неверные данные' }

  const mod = checkContent(parsed.data.text)
  if (!mod.ok) return { success: false, error: mod.reason }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, master_id')
    .eq('id', parsed.data.booking_id)
    .eq('client_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!booking) return { success: false, error: 'Запись не найдена или не завершена' }

  // Один отзыв от клиента одному мастеру (то же правило проверяет база)
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('client_id', user.id)
    .eq('master_id', booking.master_id)
    .limit(1)
    .maybeSingle()

  if (existingReview) return { success: false, error: 'Вы уже оставили отзыв этому мастеру' }

  const { error } = await supabase.from('reviews').insert({
    booking_id: parsed.data.booking_id,
    client_id: user.id,
    master_id: booking.master_id,
    rating: parsed.data.rating,
    text: parsed.data.text || null,
    photos: parsed.data.photos ?? [],
  })

  if (error) return { success: false, error: 'Не удалось сохранить отзыв' }

  revalidatePath('/dashboard/client')
  return { success: true, data: undefined }
}

export async function cancelClientBookingAction(bookingId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, starts_at')
    .eq('id', bookingId)
    .eq('client_id', user.id)
    .single()

  if (!booking) return { success: false, error: 'Запись не найдена' }

  const hoursUntil = (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < 24) {
    return { success: false, error: 'Отменить можно только за 24 часа до записи' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled_by_client', status_changed_at: new Date().toISOString() })
    .eq('id', bookingId)

  // Слот освобождает триггер release_slot_on_cancel в базе
  if (error) return { success: false, error: 'Не удалось отменить' }

  revalidatePath('/dashboard/client')
  return { success: true, data: undefined }
}

export async function updateClientProfileAction(fullName: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const trimmed = fullName.trim()
  if (!trimmed) return { success: false, error: 'Имя не может быть пустым' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: trimmed })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Не удалось сохранить' }

  revalidatePath('/dashboard/client')
  return { success: true, data: undefined }
}
