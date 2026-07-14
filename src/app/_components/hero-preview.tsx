import { TrendingUp, CalendarCheck, Wallet, Star } from 'lucide-react'

/**
 * Декоративное превью продукта в «оконной» рамке (как скриншот приложения
 * в референсе). Полностью на CSS/SVG, без внешних картинок. Цифры —
 * иллюстративные (это витрина продукта, а не реальные данные).
 */
const TILES = [
  { label: 'Записи', value: '128', icon: CalendarCheck, trend: '+12%' },
  { label: 'Доход', value: '640 000 ₸', icon: Wallet, trend: '+8%' },
  { label: 'Завершено', value: '96', icon: TrendingUp, trend: '+15%' },
  { label: 'Рейтинг', value: '4.9', icon: Star, trend: null },
]

export function HeroPreview() {
  return (
    <div className="relative mt-16 sm:mt-20">
      {/* Розовое свечение под рамкой */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-full -translate-y-1/4 rounded-full blur-[70px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,45,120,0.14), transparent 60%)' }}
      />

      {/* Рамка окна с растворением снизу */}
      <div
        className="animate-blur-in relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13] p-2 shadow-2xl"
        style={{ maskImage: 'linear-gradient(to bottom, black 62%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 62%, transparent)' }}
      >
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0f]">
          {/* Верхняя панель «окна» */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-3 text-xs text-[var(--text-3)]">Кабинет мастера · Статистика</span>
          </div>

          <div className="space-y-5 p-5">
            {/* KPI-плитки */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TILES.map(t => {
                const Icon = t.icon
                return (
                  <div key={t.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-3)]">{t.label}</span>
                      {t.trend && (
                        <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#34d399]">{t.trend}</span>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-white">{t.value}</p>
                    <Icon className="mt-2 h-3.5 w-3.5 text-[var(--violet)]" />
                  </div>
                )
              })}
            </div>

            {/* Мок area-графика */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-sm font-medium text-white">Выручка по дням</p>
              <svg viewBox="0 0 600 160" className="h-40 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF2D78" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF2D78" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 120 C 40 110, 70 70, 110 80 S 180 40, 220 60 S 300 100, 340 70 S 420 30, 470 55 S 550 20, 600 45 L 600 160 L 0 160 Z"
                  fill="url(#heroArea)"
                />
                <path
                  d="M0 120 C 40 110, 70 70, 110 80 S 180 40, 220 60 S 300 100, 340 70 S 420 30, 470 55 S 550 20, 600 45"
                  fill="none"
                  stroke="#FF5C97"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
