import Link from 'next/link'
import { ArrowRight, Shield, Zap, Star } from 'lucide-react'

const STATS = [
  { value: '0 ₸',   label: 'Базовый тариф' },
  { value: '5 мин', label: 'Настройка профиля' },
  { value: '24/7',  label: 'Онлайн-запись' },
]

const CATEGORIES = [
  { value: 'nail',        label: 'Маникюр' },
  { value: 'lash',        label: 'Ресницы' },
  { value: 'brow',        label: 'Брови' },
  { value: 'hair',        label: 'Волосы' },
  { value: 'makeup',      label: 'Макияж' },
  { value: 'cosmetology', label: 'Уход' },
]

const BENEFITS = [
  {
    icon: Shield,
    title: 'Бесплатно навсегда',
    desc: 'Профиль, расписание и онлайн-запись без скрытых платежей',
  },
  {
    icon: Zap,
    title: 'Расписание автоматически',
    desc: 'Один раз настрой шаблон — слоты создаются сами каждую неделю',
  },
  {
    icon: Star,
    title: 'Beauty Score клиентов',
    desc: 'Видишь репутацию каждого клиента до подтверждения записи',
  },
]

export function HeroSection() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-6 py-20 max-w-5xl">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Первая платформа в Казахстане на стороне мастера
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-5">
              Записи без комиссий.{' '}
              <span className="text-violet-600">Клиенты без звонков.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Создай профиль, настрой расписание один раз — и принимай
              онлайн-записи круглосуточно. Бесплатно.
            </p>

            {/* CTA */}
            <div className="flex items-center gap-3 mb-16">
              <Link
                href="/register?role=master"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/?category=nail"
                className="inline-flex items-center gap-2 border border-border text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                Найти мастера
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-8">
                  <div>
                    <p className="text-2xl font-medium text-foreground tracking-tight">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="w-px h-8 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────── */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.value}
                href={`/?category=${cat.value}`}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm text-muted-foreground border border-border hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ─────────────────────────────────── */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="flex gap-4 py-8 px-6 first:pl-0 last:pr-0">
                <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{b.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
