'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import type { Result } from '@/types/result'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

export async function registerAction(formData: FormData): Promise<Result> {
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

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
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
    console.error('Supabase Auth error:', error)
    return { success: false, error: `Ошибка: ${error.message}` }
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
