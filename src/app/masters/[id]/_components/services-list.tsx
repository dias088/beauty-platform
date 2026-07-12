import { formatPrice, formatDuration } from '@/lib/utils'
import { Clock } from 'lucide-react'

type Service = {
  id: string
  name: string
  category: string
  price_kzt: number
  duration_minutes: number
  description?: string
}

type Props = {
  services: Service[]
}

const CATEGORY_LABELS: Record<string, string> = {
  nail: 'Ногти',
  lash: 'Ресницы',
  brow: 'Брови',
  hair: 'Волосы',
  makeup: 'Макияж',
  cosmetology: 'Косметология',
}

export function ServicesList({ services }: Props) {
  return (
    <div className="space-y-3">
      {services.map(service => (
        <div
          key={service.id}
          className="surface flex items-center justify-between gap-4 rounded-[14px] p-4 transition-all duration-200 hover:translate-x-1 hover:border-[var(--violet)]/45"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{service.name}</span>
              <span className="text-xs text-[var(--text-3)]">{CATEGORY_LABELS[service.category]}</span>
            </div>
            {service.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-2)]">{service.description}</p>
            )}
            <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-3)]">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(service.duration_minutes)}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-[var(--violet-bright)]">{formatPrice(service.price_kzt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
