'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'

/** Сохраняет URL аватара в профиль текущего пользователя (мастер или клиент). */
export async function updateAvatarAction(avatarUrl: string): Promise<Result> {
  // Принимаем только ссылки на наш публичный media-бакет.
  if (!/\/storage\/v1\/object\/public\/media\//.test(avatarUrl)) {
    return { success: false, error: 'Недопустимая ссылка на изображение' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Не удалось сохранить фото' }

  revalidatePath('/dashboard/master/profile')
  revalidatePath('/dashboard/client/profile')
  revalidatePath('/', 'layout')
  return { success: true, data: undefined }
}
