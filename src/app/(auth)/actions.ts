'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import type { Result } from '@/types/result'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function loginAction(formData: FormData): Promise<Result> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Проверьте поля формы',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { success: false, error: 'Неверный email или пароль' }
  }

  revalidatePath('/', 'layout')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не удалось войти' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  redirect(profile?.role === 'master' ? '/dashboard/master' : '/')
}

export async function registerAction(
  formData: FormData
): Promise<Result<{ pendingConfirmation?: boolean; role?: 'client' | 'master' }>> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Проверьте поля формы',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Куда Supabase вернёт пользователя после клика по ссылке в письме.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (await headers()).get('origin') ||
    'http://localhost:3000'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?role=${parsed.data.role}`,
      data: {
        role: parsed.data.role,
        full_name: parsed.data.fullName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already')) {
      return { success: false, error: 'Этот email уже зарегистрирован' }
    }
    return { success: false, error: `Ошибка: ${error.message}` }
  }

  // Подтверждение почты включено: сессии ещё нет — просим проверить почту.
  // (Профиль создаёт триггер handle_new_user; запись masters создастся при
  //  первом входе на онбординге.)
  if (!data.session) {
    return { success: true, data: { pendingConfirmation: true, role: parsed.data.role } }
  }

  // Если мастер — создаём запись в masters сразу
  // (триггер в БД тоже это делает, но дублирование безопасно через on conflict)
  // Триггер handle_new_user() выполняется синхронно в той же транзакции,
  // что и вставка в auth.users, так что к моменту, когда signUp() вернул
  // результат, профиль уже гарантированно создан — искусственная задержка не нужна.
  if (parsed.data.role === 'master' && data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (profile) {
      await supabase
        .from('masters')
        .upsert({
          profile_id: data.user.id,
          city: 'Astana',
          categories: [],
        }, { onConflict: 'profile_id' })
    }
  }

  revalidatePath('/', 'layout')
  redirect(parsed.data.role === 'master' ? '/onboarding' : '/')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
