'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Check } from 'lucide-react'
import { registerAction } from '../actions'
import { AuthShell } from '@/components/shared/auth-shell'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { toast } from 'sonner'

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] transition-colors focus-within:border-[var(--violet)]/60 focus-within:bg-[rgba(255,45,120,0.06)]">
      {children}
    </div>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Предвыбор роли из ссылки: /register?role=master открывает форму как «Мастер».
  const [role, setRole] = useState<'client' | 'master'>(
    searchParams.get('role') === 'master' ? 'master' : 'client'
  )

  const ROLES = [
    { value: 'client' as const, label: 'Я клиент', desc: 'Буду записываться к мастерам' },
    { value: 'master' as const, label: 'Я мастер', desc: 'Буду принимать клиентов' },
  ]

  return (
    <AnimatedGroup preset="blur-slide">
      <form
        className="space-y-5"
        action={async (formData) => {
          formData.set('role', role)
          setPending(true)
          const result = await registerAction(formData)
          setPending(false)
          if (!result.success) {
            setErrors(result.fieldErrors || {})
            toast.error(result.error)
          }
        }}
      >
        {/* Выбор роли */}
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(r => {
            const active = role === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`relative rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-[var(--violet)] bg-[rgba(255,45,120,0.08)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)]">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{r.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">{r.desc}</p>
              </button>
            )
          })}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-2)]">Имя и фамилия</label>
          <Field>
            <input
              name="fullName"
              placeholder="Иван Петров"
              disabled={pending}
              className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)]"
            />
          </Field>
          {errors.fullName && <p className="mt-1.5 text-sm text-[#f87171]">{errors.fullName[0]}</p>}
        </div>

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
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">Минимум 8 символов, заглавная буква и цифра</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary-glow w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="text-center text-sm text-[var(--text-3)]">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-[var(--violet-bright)] hover:underline">
            Войдите
          </Link>
        </p>
      </form>
    </AnimatedGroup>
  )
}

export default function RegisterPage() {
  return (
    <AuthShell title="Создать аккаунт" subtitle="Присоединяйтесь к Beauty.kz за минуту">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  )
}
