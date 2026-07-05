'use server'

import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'

// Сохранить заметку о клиенте (хранится в master_client_notes)
// Простая реализация через отдельную таблицу — добавим в миграцию
export async function saveCrmNoteAction(clientId: string, note: string): Promise<Result<undefined>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) return { success: false, error: 'Мастер не найден' }

  const { error } = await supabase
    .from('master_client_notes')
    .upsert({ master_id: master.id, client_id: clientId, note, updated_at: new Date().toISOString() },
      { onConflict: 'master_id,client_id' })

  if (error) return { success: false, error: 'Не удалось сохранить' }

  revalidatePath('/dashboard/master/crm')
  return { success: true, data: undefined }
}
