import Link from 'next/link'
import { ArrowRight, Shield, Zap, Star } from 'lucide-react'

const STATS = [
  { value: '0 ₸',   label: 'Базовый тариф' },
  { value: '5 мин', label: 'Настройка профиля' },
  { value: '24/7',  label: 'Онлайн-запись' },
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
      <section className="relative isolate overflow-hidden border-b bg-background">
        {/* Мягкие световые пятна (ambient glow) */}
        <div
          className="aurora animate-fade-in"
          style={{ top: '-120px', right: '-80px', width: '520px', height: '520px', background: 'oklch(0.585 0.233 277 / 0.22)', animation: 'aurora-1 16s ease-in-out infinite, fade-in 1.2s ease both' }}
        />
        <div
          className="aurora animate-fade-in"
          style={{ top: '40px', left: '-140px', width: '440px', height: '440px', background: 'oklch(0.7 0.2 350 / 0.16)', animation: 'aurora-2 19s ease-in-out infinite, fade-in 1.2s ease both' }}
        />

        <div className="relative z-10 container mx-auto px-6 py-20 max-w-5xl">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="animate-fade-up stagger-1 inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 mb-8 bg-background/70 backdrop-blur-sm">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
              Первая платформа в Казахстане на стороне мастера
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up stagger-2 text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-5">
              Записи без комиссий.{' '}
              <span className="text-shimmer">Клиенты без звонков.</span>
            </h1>

            <p className="animate-fade-up stagger-3 text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Создай профиль, настрой расписание один раз — и принимай
              онлайн-записи круглосуточно. Бесплатно.
            </p>

            {/* CTA */}
            <div className="animate-fade-up stagger-4 flex items-center gap-3 mb-16">
              <Link
                href="/register?role=master"
                className="group inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-lg shadow-violet-600/20 hover:shadow-xl hover:shadow-violet-600/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/?category=nail"
                className="inline-flex items-center gap-2 border border-border text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 text-foreground"
              >
                Найти мастера
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up stagger-5 flex items-center gap-8">
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



      {/* ─── Benefits ─────────────────────────────────── */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className={`reveal group flex gap-4 py-8 px-6 first:pl-0 last:pr-0 stagger-${i + 1}`}
              >
                <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 group-hover:border-violet-300 group-hover:bg-violet-50 group-hover:-translate-y-0.5">
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
