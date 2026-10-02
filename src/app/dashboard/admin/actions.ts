'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isProUntil } from '@/lib/billing/pro'
import { env } from '@/lib/env'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = env.ADMIN_EMAILS.split(',').map(e => e.trim())

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (!ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

export async function verifyMasterAction(masterId: string): Promise<Result<undefined>> {
  const user = await checkAdmin()
  if (!user) return { success: false, error: 'Нет доступа' }

  const admin = createAdminClient()
  const { error } = await admin.from('masters').update({ is_verified: true }).eq('id', masterId)
  if (error) return { success: false, error: 'Ошибка при верификации' }

  revalidatePath('/dashboard/admin')
  return { success: true, data: undefined }
}

export async function deactivateMasterAction(masterId: string): Promise<Result<undefined>> {
  const user = await checkAdmin()
  if (!user) return { success: false, error: 'Нет доступа' }

  const admin = createAdminClient()
  const { error } = await admin.from('masters').update({ is_active: false }).eq('id', masterId)
  if (error) return { success: false, error: 'Ошибка при деактивации' }

  revalidatePath('/dashboard/admin')
  return { success: true, data: undefined }
}

export async function activateMasterAction(masterId: string): Promise<Result<undefined>> {
  const user = await checkAdmin()
  if (!user) return { success: false, error: 'Нет доступа' }

  const admin = createAdminClient()
  const { error } = await admin.from('masters').update({ is_active: true }).eq('id', masterId)
  if (error) return { success: false, error: 'Ошибка при активации' }

  revalidatePath('/dashboard/admin')
  return { success: true, data: undefined }
}

export async function activateBoostAdminAction(
  masterId: string,
  plan: '7d' | '30d'
): Promise<Result<undefined>> {
  const user = await checkAdmin()
  if (!user) return { success: false, error: 'Нет доступа' }

  const days = plan === '7d' ? 7 : 30
  const admin = createAdminClient()
  const { data: current } = await admin.from('masters').select('boost_until').eq('id', masterId).single()
  // Продлеваем от конца уже оплаченного Pro, а не от сегодня, чтобы не съесть оплаченные дни.
  const base = isProUntil(current?.boost_until) ? new Date(current!.boost_until!) : new Date()
  const boostUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await admin.from('masters').update({ boost_until: boostUntil }).eq('id', masterId)
  if (error) return { success: false, error: 'Ошибка при активации буста' }

  revalidatePath('/dashboard/admin')
  revalidatePath('/')
  return { success: true, data: undefined }
}
