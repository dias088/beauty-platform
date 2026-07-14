'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  Hand,
  Footprints,
  Scissors,
  Palette,
  Eye,
  Brush,
  Droplet,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { MagneticButton } from '@/components/premium/magnetic-button'
import { TypewriterText } from '@/components/premium/typewriter-text'
import { GlowCard } from '@/components/premium/glow-card'

/**
 * Услуги лендинга. Каждая ведёт на каталог с РЕАЛЬНЫМ фильтром категории
 * (значения совпадают с filters-bar / category-sections), чтобы клик
 * всегда открывал непустую выборку. Без выдуманных категорий.
 */
const SERVICES: { num: string; label: string; desc: string; href: string; icon: LucideIcon }[] = [
  { num: '01', label: 'Маникюр', desc: 'Аккуратные ногти и стойкое покрытие', href: '/?category=nail', icon: Hand },
  { num: '02', label: 'Педикюр', desc: 'Уход и здоровье стоп', href: '/?category=nail', icon: Footprints },
  { num: '03', label: 'Стрижка', desc: 'Форма под тип волос и лица', href: '/?category=hair', icon: Scissors },
  { num: '04', label: 'Окрашивание', desc: 'Цвет, тон, сложные техники', href: '/?category=hair', icon: Palette },
  { num: '05', label: 'Брови', desc: 'Форма, коррекция, окрашивание', href: '/?category=brow', icon: Eye },
  { num: '06', label: 'Ресницы', desc: 'Наращивание и ламинирование', href: '/?category=lash', icon: Eye },
  { num: '07', label: 'Макияж', desc: 'Дневной, вечерний, свадебный', href: '/?category=makeup', icon: Brush },
  { num: '08', label: 'Косметология', desc: 'Уход за кожей лица', href: '/?category=cosmetology', icon: Droplet },
  { num: '09', label: 'Все мастера', desc: 'Смотреть весь каталог', href: '/?sort=rating', icon: Users },
]

const FACTS = [
  { value: '0%', label: 'комиссии с мастеров' },
  { value: '24/7', label: 'онлайн-запись' },
  { value: 'Честные', label: 'отзывы клиентов' },
]

export function HeroSection() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden">
      {/* Мягкая радиальная розовая подложка сверху — глубина */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px]"
        style={{ background: 'radial-gradient(58% 58% at 50% 0%, rgba(255,45,120,0.06), transparent 72%)' }}
      />
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-24 max-w-5xl">
        {/* Бейдж — минимал, uppercase */}
        <div className="animate-blur-in inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-3)]">
          <span className="status-dot h-1 w-1 rounded-full bg-[var(--success)] text-[var(--success)]" />
          Уже в Астане
        </div>

        {/* Заголовок — крупный и сдержанный */}
        <h1 className="animate-blur-in mt-8 max-w-4xl text-[2.9rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-[4.25rem]">
          Красота начинается с{' '}
          <span className="text-[#FF5C97]">правильного мастера</span>
        </h1>

        {/* Typewriter — спокойнее */}
        <p className="animate-blur-in mt-8 flex min-h-[1.75rem] flex-wrap items-center text-lg text-[var(--text-2)]">
          <span className="mr-2.5 text-[var(--text-3)]">Найди</span>
          <TypewriterText
            className="font-medium text-white"
            phrases={[
              'маникюр за 2 минуты',
              'мастера рядом с домом',
              'запись без звонков и переписок',
              'честные отзывы клиентов',
            ]}
          />
        </p>

        {/* CTA */}
        <div className="animate-blur-in mt-10">
          <MagneticButton onClick={() => setOpen(v => !v)}>
            Смотреть услуги
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
            />
          </MagneticButton>
        </div>

        {/* Раскрывающаяся сетка услуг — каждая карточка выезжает с задержкой */}
        {open && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {SERVICES.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.num}
                  // При reduce-motion — мягкое появление ТОЛЬКО по прозрачности
                  // (без сдвига/масштаба), с лёгким каскадом. Иначе — «пружинный» въезд.
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={
                    reduce
                      ? { delay: i * 0.05, duration: 0.4, ease: 'easeOut' }
                      : { delay: 0.05 + i * 0.07, type: 'spring', stiffness: 320, damping: 22 }
                  }
                >
                  <GlowCard className="service-line group h-full overflow-hidden p-5">
                    <Link href={s.href} className="block">
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-semibold tracking-widest text-[var(--label)] transition-colors group-hover:text-[var(--violet)]">
                          {s.num}
                        </span>
                        <Icon className="h-4 w-4 text-[var(--text-3)] transition-colors group-hover:text-[var(--violet)]" />
                      </div>
                      <p className="mt-6 text-[17px] font-bold tracking-[-0.01em] text-white">
                        {s.label}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-2)]">{s.desc}</p>
                    </Link>
                  </GlowCard>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Полоса честных фактов — hairline, tech-luxe */}
        <div className="animate-blur-in mt-20 flex flex-wrap gap-x-14 gap-y-8 border-t border-white/[0.06] pt-8">
          {FACTS.map(f => (
            <div key={f.label}>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">{f.value}</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--text-3)]">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
