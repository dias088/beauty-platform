import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin } from 'lucide-react'
import type { MasterListItem } from '@/lib/queries/masters'
import { FavoriteButton } from './favorite-button'

type Props = {
  master: MasterListItem
}

const CATEGORY_LABELS: Record<string, string> = {
  nail: '💅 Ногти',
  lash: '✨ Ресницы',
  brow: '👁️ Брови',
  hair: '💇 Волосы',
  makeup: '💄 Макияж',
  cosmetology: '🧴 Косметология',
}

export function MasterCard({ master }: Props) {
  const hasReviews = master.reviews_count > 0

  return (
    <div className="relative group h-full">
      <Link href={`/masters/${master.id}`} className="block h-full">
        <Card className="overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 border-border/60">
          {/* Фото */}
          <div className="relative w-full h-52 bg-muted shrink-0 overflow-hidden">
            {master.primary_photo ? (
              <Image
                src={master.primary_photo}
                alt={master.full_name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <span className="text-4xl">💄</span>
                <span className="text-sm">Нет фото</span>
              </div>
            )}

            {/* Оверлей снизу с градиентом */}
            {master.primary_photo && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            )}

            {/* TOP бейдж */}
            {master.is_boosted && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                ⚡ TOP
              </div>
            )}

            {/* Цена снизу на фото */}
            {master.min_price && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                от {master.min_price.toLocaleString('ru')} ₸
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="p-4 flex flex-col gap-2.5 flex-1">
            {/* Имя и рейтинг */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight line-clamp-1">
                {master.full_name}
              </h3>
              {hasReviews ? (
                <div className="flex items-center gap-1 shrink-0 text-sm">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{master.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-xs">({master.reviews_count})</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground shrink-0">Новый</span>
              )}
            </div>

            {/* Категории */}
            <div className="flex flex-wrap gap-1.5">
              {master.categories.slice(0, 3).map(cat => (
                <Badge key={cat} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                  {CATEGORY_LABELS[cat]}
                </Badge>
              ))}
              {master.categories.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal text-muted-foreground">
                  +{master.categories.length - 3}
                </Badge>
              )}
            </div>

            {/* Адрес */}
            {master.address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{master.address}</span>
              </div>
            )}

            {/* CTA */}
            <div className="pt-1 mt-auto">
              <div className="w-full text-center py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors group-hover:bg-primary/90">
                Записаться
              </div>
            </div>
          </div>
        </Card>
      </Link>

      {/* Кнопка избранного — поверх ссылки */}
      <FavoriteButton
        masterId={master.id}
        className="absolute top-2.5 right-2.5 z-10"
      />
    </div>
  )
}
