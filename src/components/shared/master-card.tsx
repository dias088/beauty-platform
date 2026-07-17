import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, ImageOff, Zap } from 'lucide-react'
import type { MasterListItem } from '@/lib/queries/masters'
import { FavoriteButton } from './favorite-button'
import { GlowCard } from '@/components/premium/glow-card'

type Props = {
  master: MasterListItem
}

const CATEGORY_LABELS: Record<string, string> = {
  nail: 'Ногти',
  lash: 'Ресницы',
  brow: 'Брови',
  hair: 'Волосы',
  makeup: 'Макияж',
  cosmetology: 'Косметология',
}

export function MasterCard({ master }: Props) {
  const hasReviews = master.reviews_count > 0

  return (
    <div className="group relative h-full">
      <Link href={`/masters/${master.id}`} className="block h-full">
        <GlowCard className="flex h-full flex-col overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1.5">
          {/* Фото */}
          <div className="relative h-48 w-full shrink-0 overflow-hidden bg-white/[0.04]">
            {master.primary_photo ? (
              <Image
                src={master.primary_photo}
                alt={master.full_name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-3)]">
                <ImageOff className="h-8 w-8" strokeWidth={1.5} />
                <span className="text-sm">Нет фото</span>
              </div>
            )}

            {/* Затемнение снизу для читаемости бейджей */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* TOP бейдж */}
            {master.is_boosted && (
              <div
                className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-md"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Zap className="h-3 w-3 fill-white" /> TOP
              </div>
            )}

            {/* Цена */}
            {master.min_price && (
              <div className="absolute bottom-2.5 right-2.5 whitespace-nowrap rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                от {master.min_price.toLocaleString('ru')} ₸
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            {/* Имя и рейтинг */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-[15px] font-bold leading-tight tracking-tight text-white">
                {master.full_name}
              </h3>
              {hasReviews ? (
                <div className="flex shrink-0 items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                  <span className="font-semibold text-white">{master.rating.toFixed(1)}</span>
                  <span className="text-xs text-[var(--text-3)]">({master.reviews_count})</span>
                </div>
              ) : (
                <span className="shrink-0 text-xs text-[var(--text-3)]">Новый</span>
              )}
            </div>

            {/* Категории */}
            <div className="flex flex-wrap gap-1.5">
              {master.categories.slice(0, 3).map(cat => (
                <span
                  key={cat}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-[var(--text-2)]"
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
              ))}
              {master.categories.length > 3 && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-[var(--text-3)]">
                  +{master.categories.length - 3}
                </span>
              )}
            </div>

            {/* Адрес */}
            {master.address && (
              <div className="mt-auto flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{master.address}</span>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-1">
              <div
                className="w-full rounded-[12px] py-2 text-center text-sm font-semibold text-white transition-all duration-200 group-hover:shadow-[var(--glow-violet)]"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Записаться
              </div>
            </div>
          </div>
        </GlowCard>
      </Link>

      {/* Кнопка избранного — поверх ссылки */}
      <FavoriteButton masterId={master.id} className="absolute right-2.5 top-2.5 z-10" />
    </div>
  )
}
