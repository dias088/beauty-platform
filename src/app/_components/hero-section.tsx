import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { HeroPreview } from './hero-preview'

/**
 * Чистый минималистичный hero (сдержанный, богатый): пилюля, крупный
 * заголовок, подзаголовок, две CTA, снизу — превью продукта в рамке.
 * Без JS — появление на CSS (.animate-blur-in), поэтому серверный компонент.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Мягкая радиальная подложка сверху */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px]"
        style={{ background: 'radial-gradient(58% 55% at 50% 0%, rgba(255,45,120,0.07), transparent 72%)' }}
      />

      <div className="relative z-10 container mx-auto max-w-5xl px-6 pt-28 pb-16 sm:pt-32">
        {/* Пилюля */}
        <div className="animate-blur-in inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] p-1 pr-3 text-xs backdrop-blur">
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
            Астана
          </span>
          <span className="text-[var(--text-2)]">Уже принимаем записи</span>
          <ArrowRight className="h-3 w-3 text-[var(--text-3)]" />
        </div>

        {/* Заголовок */}
        <h1 className="animate-blur-in mt-8 max-w-3xl text-balance text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-[4.5rem]">
          Красота начинается с{' '}
          <span className="text-[#FF5C97]">правильного мастера</span>
        </h1>

        {/* Подзаголовок */}
        <p className="animate-blur-in mt-7 max-w-xl text-pretty text-base leading-relaxed text-[var(--text-2)] sm:text-lg">
          Онлайн-запись к мастерам красоты в Астане. Без звонков и переписок —
          выбирайте по портфолио, отзывам и цене.
        </p>

        {/* Кнопки */}
        <div className="animate-blur-in mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/?sort=rating"
            className="btn-primary-glow inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Найти мастера
          </Link>
          <Link
            href="/register?role=master"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.06]"
          >
            Стать мастером
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Превью продукта в рамке */}
      <div className="relative z-10 container mx-auto max-w-5xl px-6">
        <HeroPreview />
      </div>
    </section>
  )
}
