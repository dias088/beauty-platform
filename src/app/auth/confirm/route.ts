import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Подтверждение email. Supabase после клика по ссылке в письме ведёт сюда.
 * Поддерживаем оба формата ссылки:
 *  - PKCE: ?code=... → exchangeCodeForSession
 *  - token_hash: ?token_hash=...&type=signup → verifyOtp
 * После успешной проверки сессия ставится в куки, и мы ведём пользователя
 * в нужный кабинет (мастер → онбординг, клиент → главная).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const role = url.searchParams.get('role')

  const dest = role === 'master' ? '/onboarding' : '/'
  const supabase = await createClient()

  let ok = false
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  }

  if (ok) {
    return NextResponse.redirect(new URL(dest, url.origin))
  }

  // Ссылка недействительна или устарела.
  return NextResponse.redirect(new URL('/login?error=confirm', url.origin))
}
