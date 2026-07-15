import { Search, Star, SlidersHorizontal } from 'lucide-react'

/**
 * Декоративное превью продукта в «оконной» рамке — мини-каталог мастеров
 * (как выглядит поиск на сайте). Полностью на CSS, без внешних картинок.
 * Содержимое — иллюстративное (витрина интерфейса, не реальные мастера).
 */
const PILLS = ['Маникюр', 'Ресницы', 'Брови', 'Волосы', 'Макияж']

const CARDS = [
  { name: 'Айгерим М.', spec: 'Маникюр · Педикюр', rating: '4.9', reviews: 42, price: 'от 5 000 ₸', g: 'linear-gradient(135deg,#FF2D78,#FF6B4A)' },
  { name: 'Динара К.', spec: 'Ресницы · Брови', rating: '5.0', reviews: 28, price: 'от 8 000 ₸', g: 'linear-gradient(135deg,#C8215E,#FF2D78)' },
  { name: 'Сауле Т.', spec: 'Макияж', rating: '4.8', reviews: 17, price: 'от 12 000 ₸', g: 'linear-gradient(135deg,#FF5C97,#C8215E)' },
]

export function HeroPreview() {
  return (
    <div className="relative mt-16 sm:mt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-full -translate-y-1/4 rounded-full blur-[70px]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(255,45,120,0.12), transparent 60%)' }}
      />

      <div
        className="animate-blur-in relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13] p-2 shadow-2xl"
        style={{ maskImage: 'linear-gradient(to bottom, black 64%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 64%, transparent)' }}
      >
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0f]">
          {/* Верхняя панель «окна» */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-3 text-xs text-[var(--text-3)]">Beauty.kz · Каталог мастеров</span>
          </div>

          <div className="space-y-4 p-5">
            {/* Поиск + фильтры */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[var(--text-3)]">
                <Search className="h-4 w-4" />
                Поиск мастера, услуги или адреса…
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[var(--text-3)]">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Цена</span>
              </div>
            </div>

            {/* Пиллы категорий */}
            <div className="flex flex-wrap gap-2">
              {PILLS.map((p, i) => (
                <span
                  key={p}
                  className={
                    i === 0
                      ? 'rounded-full px-3 py-1 text-xs font-medium text-white'
                      : 'rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[var(--text-2)]'
                  }
                  style={i === 0 ? { background: 'var(--gradient-primary)' } : undefined}
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Карточки мастеров */}
            <div className="grid grid-cols-3 gap-3">
              {CARDS.map(c => (
                <div key={c.name} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
                  <div className="h-20 sm:h-24" style={{ background: c.g, opacity: 0.85 }} />
                  <div className="p-3">
                    <p className="truncate text-[13px] font-semibold text-white">{c.name}</p>
                    <p className="truncate text-[11px] text-[var(--text-3)]">{c.spec}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-white">
                        <Star className="h-3 w-3 fill-[#fbbf24] text-[#fbbf24]" />
                        {c.rating}
                        <span className="text-[var(--text-3)]">({c.reviews})</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--violet-bright)]">{c.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
