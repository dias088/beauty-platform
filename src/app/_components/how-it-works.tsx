import { Search, Calendar, Star, UserPlus, Clock, TrendingUp, type LucideIcon } from 'lucide-react'
import { SectionReveal } from '@/components/premium/section-reveal'

type Step = { icon: LucideIcon; title: string; desc: string }

const CLIENT_STEPS: Step[] = [
  { icon: Search,   title: 'Найди мастера',     desc: 'Фильтруй по категории, цене и рейтингу. Смотри портфолио и отзывы.' },
  { icon: Calendar, title: 'Выбери время',      desc: 'Свободный слот из расписания мастера. Без звонков и переписок.' },
  { icon: Star,     title: 'Получи привилегии', desc: 'Копи Beauty Score — открывай скидки и статус надёжного клиента.' },
]

const MASTER_STEPS: Step[] = [
  { icon: UserPlus,   title: 'Регистрируйся бесплатно', desc: 'Профиль с портфолио и услугами за 5 минут. 0% комиссии.' },
  { icon: Clock,      title: 'Управляй расписанием',    desc: 'Настрой шаблон один раз — слоты создаются автоматически.' },
  { icon: TrendingUp, title: 'Расти вместе с нами',     desc: 'Аналитика, отзывы, буст профиля — всё в одном кабинете.' },
]

function StepColumn({
  eyebrow,
  steps,
  accent,
}: {
  eyebrow: string
  steps: Step[]
  accent: boolean
}) {
  return (
    <div>
      <p
        className={`mb-7 border-b pb-4 text-xs font-semibold uppercase tracking-[0.14em] ${
          accent
            ? 'border-[rgba(167,139,250,0.2)] text-[var(--violet-bright)]'
            : 'border-white/10 text-[var(--text-3)]'
        }`}
      >
        {eyebrow}
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <SectionReveal key={step.title} delay={i * 0.08}>
              <div className="surface group flex gap-4 rounded-[18px] p-5 transition-colors hover:border-[var(--violet)]/40">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs font-semibold tracking-widest text-[var(--label)]">
                    0{i + 1}
                  </span>
                  <div
                    className={`mt-2 flex h-9 w-9 items-center justify-center rounded-xl border ${
                      accent
                        ? 'border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.09)]'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${accent ? 'text-[var(--violet-bright)]' : 'text-[var(--text-2)]'}`} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[15px] font-semibold tracking-tight text-white">{step.title}</p>
                  <p className="text-sm leading-relaxed text-[var(--text-2)]">{step.desc}</p>
                </div>
              </div>
            </SectionReveal>
          )
        })}
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section className="relative border-t border-white/[0.06]">
      <div className="container mx-auto max-w-5xl px-6 py-20">
        <SectionReveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">
            Как это работает
          </p>
          <h2 className="text-[2.1rem] font-semibold tracking-[-0.025em] text-white sm:text-[2.4rem]">
            Просто и понятно
          </h2>
        </SectionReveal>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <StepColumn eyebrow="Для клиентов" steps={CLIENT_STEPS} accent={false} />
          <StepColumn eyebrow="Для мастеров" steps={MASTER_STEPS} accent />
        </div>
      </div>
    </section>
  )
}
