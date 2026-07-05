'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'

export type DiscountSettings = {
  verified_discount: number
  trusted_discount: number
}

export async function getDiscountSettingsAction(): Promise<DiscountSettings> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { verified_discount: 0, trusted_discount: 0 }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { verified_discount: 0, trusted_discount: 0 }

  const { data } = await supabase
    .from('master_score_discounts')
    .select('verified_discount, trusted_discount')
    .eq('master_id', master.id)
    .single()

  return data ?? { verified_discount: 0, trusted_discount: 0 }
}

export async function saveDiscountSettingsAction(
  verified_discount: number,
  trusted_discount: number
): Promise<Result<undefined>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите в аккаунт' }

  // Валидация
  if (
    !Number.isInteger(verified_discount) || verified_discount < 0 || verified_discount > 30 ||
    !Number.isInteger(trusted_discount)  || trusted_discount  < 0 || trusted_discount  > 30
  ) {
    return { success: false, error: 'Скидка должна быть от 0 до 30%' }
  }

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) return { success: false, error: 'Профиль мастера не найден' }

  // upsert — создаёт если нет, обновляет если есть
  const { error } = await supabase
    .from('master_score_discounts')
    .upsert({
      master_id: master.id,
      verified_discount,
      trusted_discount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'master_id' })

  if (error) return { success: false, error: 'Не удалось сохранить настройки' }

  revalidatePath('/dashboard/master/profile')
  return { success: true, data: undefined }
}
