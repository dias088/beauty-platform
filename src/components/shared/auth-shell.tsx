import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Премиум сплит-экран для авторизации: слева форма, справа — брендовая
 * панель (тёмная, розовые орбы, без внешних картинок, чтобы ничего не
 * ломалось). На мобильных правая панель скрыта.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* Левая колонка — форма */}
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center">
            <span className="text-lg font-extrabold tracking-tight text-white">
              Beauty<span className="text-[var(--violet)]">.</span>kz
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>

      {/* Правая колонка — брендовый визуал */}
      <section className="relative hidden flex-1 overflow-hidden md:block">
        <div className="grid-overlay" />
        <div
          className="orb"
          style={{ top: '8%', left: '12%', width: 440, height: 440, background: 'var(--orb-1)', opacity: 0.5 }}
        />
        <div
          className="orb"
          style={{ bottom: '2%', right: '-8%', width: 380, height: 380, background: 'var(--orb-2)', opacity: 0.4 }}
        />

        <div className="relative z-10 flex h-full flex-col justify-end p-12">
          <p className="text-[2.4rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
            Красота начинается с{' '}
            <span className="gradient-text">правильного мастера</span>
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[var(--text-2)]">
            Онлайн-запись к мастерам красоты в Астане. 0% комиссии, честные отзывы,
            запись без звонков и переписок.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {[
              { v: '0%', l: 'комиссии' },
              { v: '24/7', l: 'онлайн-запись' },
              { v: 'Честные', l: 'отзывы' },
            ].map(f => (
              <div key={f.l}>
                <p className="text-xl font-extrabold text-white">{f.v}</p>
                <p className="text-xs text-[var(--text-3)]">{f.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
