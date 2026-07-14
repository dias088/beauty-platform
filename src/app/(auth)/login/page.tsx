'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { loginAction } from '../actions'
import { AuthShell } from '@/components/shared/auth-shell'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { toast } from 'sonner'

/** Стеклянная обёртка поля с розовым focus. */
function Field({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-[var(--violet)]/60 focus-within:bg-[rgba(255,45,120,0.06)]">
      {children}
    </div>
  )
}

export default function LoginPage() {
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthShell title="С возвращением" subtitle="Войдите в свой аккаунт Beauty.kz">
      <AnimatedGroup preset="blur-slide">
        <form
          className="space-y-5"
          action={async (formData) => {
            setPending(true)
            const result = await loginAction(formData)
            setPending(false)
            if (!result.success) {
              setErrors(result.fieldErrors || {})
              toast.error(result.error)
            }
          }}
        >
          <div>
            <label className="text-sm font-medium text-[var(--text-2)]">Email</label>
            <Field>
              <input
                name="email"
                type="email"
                placeholder="example@mail.com"
                disabled={pending}
                className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)]"
              />
            </Field>
            {errors.email && <p className="mt-1.5 text-sm text-[#f87171]">{errors.email[0]}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-2)]">Пароль</label>
            <Field>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={pending}
                  className="w-full rounded-xl bg-transparent px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--text-3)] transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            {errors.password && <p className="mt-1.5 text-sm text-[#f87171]">{errors.password[0]}</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-primary-glow w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Вход...' : 'Войти'}
          </button>

          <p className="text-center text-sm text-[var(--text-3)]">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-medium text-[var(--violet-bright)] hover:underline">
              Зарегистрируйтесь
            </Link>
          </p>
        </form>
      </AnimatedGroup>
    </AuthShell>
  )
}
