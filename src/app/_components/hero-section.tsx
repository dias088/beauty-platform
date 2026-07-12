'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
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

/** Каскад появления карточек услуг: контейнер задаёт stagger, карточка —
 *  «пружинный» въезд снизу с лёгким overshoot (эффект cardPop). */
const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } },
}

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
      <div className="relative z-10 container mx-auto px-6 pt-24 pb-20 max-w-5xl">
        {/* Бейдж «Уже в Астане» */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-2)] backdrop-blur">
          <span className="status-dot h-1.5 w-1.5 rounded-full bg-[var(--success)] text-[var(--success)]" />
          Уже в Астане
        </div>

        {/* Заголовок */}
        <h1 className="animate-fade-in-up mt-7 max-w-3xl text-[2.6rem] font-extrabold leading-[1.08] tracking-[-0.022em] text-white sm:text-[3.5rem]">
          Красота начинается с{' '}
          <span className="gradient-text">правильного мастера</span>
        </h1>

        {/* Typewriter */}
        <p className="animate-fade-in-up mt-6 flex min-h-[1.75rem] flex-wrap items-center text-lg text-[var(--text-2)]">
          <span className="mr-2 font-medium text-[var(--text-2)]">Найди:</span>
          <TypewriterText
            className="font-medium text-[var(--violet-bright)]"
            phrases={[
              'маникюр за 2 минуты',
              'мастера рядом с домом',
              'запись без звонков и переписок',
              'честные отзывы клиентов',
            ]}
          />
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up mt-9">
          <MagneticButton onClick={() => setOpen(v => !v)}>
            Смотреть услуги
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
            />
          </MagneticButton>
        </div>

        {/* Раскрывающаяся сетка услуг — каскадное появление (stagger) */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3"
              variants={reduce ? undefined : gridVariants}
              initial={reduce ? false : 'hidden'}
              animate={reduce ? undefined : 'show'}
              exit={reduce ? undefined : 'exit'}
            >
              {SERVICES.map(s => {
                const Icon = s.icon
                return (
                  <motion.div key={s.num} variants={reduce ? undefined : cardVariants}>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Полоса честных фактов (без выдуманной статистики) */}
        <div className="animate-fade-in-up mt-16 flex flex-wrap items-center gap-x-10 gap-y-6">
          {FACTS.map((f, i) => (
            <div key={f.label} className="flex items-center gap-10">
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-white">{f.value}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">{f.label}</p>
              </div>
              {i < FACTS.length - 1 && <div className="hidden h-9 w-px bg-white/10 sm:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
