import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { MagneticButton } from '@/components/premium/magnetic-button'
import { SectionReveal } from '@/components/premium/section-reveal'

const PERKS = [
  'Бесплатный базовый тариф навсегда',
  '0% комиссии с каждой записи',
  'Автоматическое расписание и онлайн-запись 24/7',
]

export function LandingOutro() {
  return (
    <>
      {/* CTA для мастеров */}
      <section className="relative border-t border-white/[0.06]">
        <div className="container mx-auto max-w-5xl px-6 py-20">
          <SectionReveal>
            <div className="surface relative overflow-hidden rounded-[24px] p-8 sm:p-12">
              <div
                className="orb"
                style={{
                  top: '-120px',
                  right: '-60px',
                  width: '360px',
                  height: '360px',
                  background: 'var(--orb-2)',
                  opacity: 0.25,
                }}
              />
              <div className="relative z-10 max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--violet-bright)]">
                  Для мастеров
                </p>
                <h2 className="mt-3 text-[1.9rem] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[2.2rem]">
                  Ведите запись бесплатно
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-2)]">
                  Платформа на стороне мастера: никаких комиссий и скрытых
                  платежей. Монетизация — только через добровольный буст профиля.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {PERKS.map(perk => (
                    <li key={perk} className="flex items-center gap-3 text-sm text-[var(--text-1)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.14)]">
                        <Check className="h-3 w-3 text-[var(--success)]" />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <MagneticButton href="/register?role=master">
                    Создать профиль мастера
                    <ArrowRight className="h-4 w-4" />
                  </MagneticButton>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Футер */}
      <footer className="relative border-t border-white/[0.06]">
        <div className="container mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Beauty<span className="text-[var(--violet)]">.</span>kz
              </span>
              <p className="mt-2 text-sm text-[var(--text-3)]">
                Онлайн-запись к мастерам красоты в Астане.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-2)]">
              <Link href="/?sort=rating" className="transition-colors hover:text-white">Каталог</Link>
              <Link href="/register?role=master" className="transition-colors hover:text-white">Мастерам</Link>
              <Link href="/login" className="transition-colors hover:text-white">Войти</Link>
            </nav>
          </div>
          <p className="mt-8 text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Beauty.kz — платформа на стороне мастера.
          </p>
        </div>
      </footer>
    </>
  )
}
