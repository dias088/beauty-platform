'use server'

import { createClient } from '@/lib/supabase/server'
import { masterBasicsSchema, masterLocationSchema, masterServiceSchema } from '@/lib/validations/master'
import type { Result } from '@/types/result'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveBasicsAction(
  bio: string,
  categories: string[],
  instagram?: string,
): Promise<Result> {
  const parsed = masterBasicsSchema.safeParse({
    bio,
    categories,
    instagram,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Проверьте поля',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите снова' }

  const { error } = await supabase.from('masters').upsert({
    profile_id: user.id,
    bio: parsed.data.bio,
    categories: parsed.data.categories as any,
    instagram_handle: parsed.data.instagram || null,
  }, { onConflict: 'profile_id' })

  if (error) return { success: false, error: 'Не удалось сохранить' }

  revalidatePath('/onboarding')
  redirect('/onboarding?step=2')
}

export async function saveLocationAction(input: { address: string; lat: number; lng: number }): Promise<Result> {
  const parsed = masterLocationSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Проверьте данные',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите снова' }

  const { error } = await supabase.from('masters').update({
    address: parsed.data.address,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
  }).eq('profile_id', user.id)

  if (error) return { success: false, error: 'Не удалось сохранить' }
  revalidatePath('/onboarding')
  redirect('/onboarding?step=3')
}

export async function savePhotoRecordAction(input: { url: string; storagePath: string }): Promise<Result<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) return { success: false, error: 'Сначала заполните основную информацию' }

  const { count } = await supabase.from('portfolio_photos').select('*', { count: 'exact', head: true }).eq('master_id', master.id)
  if ((count ?? 0) >= 10) return { success: false, error: 'Максимум 10 фото' }

  const { data, error } = await supabase.from('portfolio_photos').insert({
    master_id: master.id,
    url: input.url,
    storage_path: input.storagePath,
    position: count ?? 0,
  }).select('id').single()

  if (error || !data) return { success: false, error: 'Не удалось сохранить' }

  revalidatePath('/onboarding')
  return { success: true, data: { id: data.id } }
}

export async function deletePortfolioPhotoAction(photoId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: photo } = await supabase
    .from('portfolio_photos')
    .select('storage_path, master_id, masters!inner(profile_id)')
    .eq('id', photoId)
    .single()

  if (!photo || (photo.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  await supabase.storage.from('media').remove([photo.storage_path])
  await supabase.from('portfolio_photos').delete().eq('id', photoId)

  revalidatePath('/onboarding')
  return { success: true, data: undefined }
}

export async function reorderPortfolioAction(photoIds: string[]): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const updates = photoIds.map((id, index) =>
    supabase.from('portfolio_photos').update({ position: index }).eq('id', id)
  )
  await Promise.all(updates)

  revalidatePath('/onboarding')
  return { success: true, data: undefined }
}

export async function completePhotosStepAction(): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) return { success: false, error: 'Сначала заполните основную информацию' }

  const { count } = await supabase.from('portfolio_photos').select('*', { count: 'exact', head: true }).eq('master_id', master.id)
  if ((count ?? 0) < 3) {
    return { success: false, error: 'Загрузите минимум 3 фото' }
  }

  redirect('/onboarding?step=4')
}

export async function addServiceAction(input: any): Promise<Result<{ id: string }>> {
  const parsed = masterServiceSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Проверьте поля',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) return { success: false, error: 'Сначала заполните основную информацию' }

  const { data, error } = await supabase.from('services').insert({
    master_id: master.id,
    name: parsed.data.name,
    category: parsed.data.category,
    price_kzt: parsed.data.price_kzt,
    duration_minutes: parsed.data.duration_minutes,
    description: parsed.data.description,
  }).select('id').single()

  if (error || !data) return { success: false, error: 'Не удалось добавить' }

  revalidatePath('/onboarding')
  return { success: true, data: { id: data.id } }
}

export async function deleteServiceAction(serviceId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: service } = await supabase
    .from('services')
    .select('master_id, masters!inner(profile_id)')
    .eq('id', serviceId)
    .single()

  if (!service || (service.masters as any).profile_id !== user.id) {
    return { success: false, error: 'Нет доступа' }
  }

  await supabase.from('services').delete().eq('id', serviceId)

  revalidatePath('/onboarding')
  return { success: true, data: undefined }
}

export async function completeOnboardingAction(): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Войдите' }

  const { data: master } = await supabase.from('masters')
    .select('id, bio, address, lat, lng')
    .eq('profile_id', user.id)
    .single()

  if (!master?.bio || !master?.address || !master?.lat) {
    return { success: false, error: 'Заполните все шаги' }
  }

  const { count: photosCount } = await supabase.from('portfolio_photos')
    .select('*', { count: 'exact', head: true })
    .eq('master_id', master.id)
  if ((photosCount ?? 0) < 3) return { success: false, error: 'Минимум 3 фото' }

  const { count: servicesCount } = await supabase.from('services')
    .select('*', { count: 'exact', head: true })
    .eq('master_id', master.id)
  if ((servicesCount ?? 0) < 1) return { success: false, error: 'Добавьте хотя бы одну услугу' }

  await supabase.from('masters').update({ is_active: true }).eq('id', master.id)

  redirect('/dashboard/master?welcome=true')
}
