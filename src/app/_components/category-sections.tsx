import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronRight, Hand, Scissors, Eye, Palette, Droplet, Zap, ImageOff, type LucideIcon } from 'lucide-react'
import type { MasterListItem } from '@/lib/queries/masters'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { SectionReveal } from '@/components/premium/section-reveal'

const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'nail',        label: 'Маникюр и педикюр', icon: Hand },
  { value: 'hair',        label: 'Волосы',             icon: Scissors },
  { value: 'lash',        label: 'Ресницы',            icon: Eye },
  { value: 'brow',        label: 'Брови',              icon: Eye },
  { value: 'makeup',      label: 'Макияж',             icon: Palette },
  { value: 'cosmetology', label: 'Косметология',       icon: Droplet },
]

function CompactMasterCard({ master }: { master: MasterListItem }) {
  return (
    <div className="relative group flex-shrink-0 w-48">
      <Link href={`/masters/${master.id}`} className="block">
        <div className="surface rounded-2xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[var(--violet)]/40">
          <div className="relative h-36 bg-white/[0.04] overflow-hidden">
            {master.primary_photo ? (
              <Image
                src={master.primary_photo}
                alt={master.full_name}
                fill
                sizes="192px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageOff className="w-6 h-6" strokeWidth={1.5} />
              </div>
            )}
            {master.is_boosted && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                <Zap className="w-3 h-3 fill-amber-900" /> TOP
              </div>
            )}
          </div>

          <div className="p-3">
            <p className="font-semibold text-sm leading-tight line-clamp-1">{master.full_name}</p>

            {master.address && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{master.address}</p>
            )}

            <div className="flex items-center justify-between mt-2 gap-1">
              {master.reviews_count > 0 ? (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{master.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({master.reviews_count})</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Новый</span>
              )}
              {master.min_price && (
                <span className="text-xs font-semibold text-primary shrink-0">
                  от {master.min_price.toLocaleString('ru')} ₸
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <FavoriteButton masterId={master.id} className="absolute top-2 right-2 z-10" />
    </div>
  )
}

type Props = {
  masters: MasterListItem[]
}

export function CategorySections({ masters }: Props) {
  const sections = CATEGORIES.map(cat => ({
    ...cat,
    // Показываем мастера в категории, только если у него есть УСЛУГА в ней
    masters: masters.filter(m => m.service_categories.includes(cat.value)),
  })).filter(s => s.masters.length > 0)

  if (sections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Пока нет активных мастеров. Загляните позже!
      </div>
    )
  }

  return (
    <div className="py-12 space-y-12">
      {sections.map((section, i) => (
        <SectionReveal key={section.value} delay={i * 0.04}>
          <div className="container mx-auto px-4 flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2.5 text-white">
              <section.icon className="w-4 h-4 text-[var(--violet)]" />
              <span>{section.label}</span>
              <span className="text-sm font-normal text-[var(--text-3)]">
                {section.masters.length}
              </span>
            </h2>
            <Link
              href={`/?category=${section.value}`}
              className="text-sm text-[var(--violet-bright)] font-medium flex items-center gap-0.5 hover:underline shrink-0"
            >
              Все
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-3 px-4 md:px-[max(1rem,calc((100vw-1280px)/2+1rem))] scrollbar-hide">
            {section.masters.slice(0, 12).map(master => (
              <CompactMasterCard key={master.id} master={master} />
            ))}
            {section.masters.length > 12 && (
              <Link
                href={`/?category=${section.value}`}
                className="flex-shrink-0 w-48 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
                <span className="text-sm font-medium">Ещё {section.masters.length - 12}</span>
              </Link>
            )}
          </div>
        </SectionReveal>
      ))}
    </div>
  )
}
