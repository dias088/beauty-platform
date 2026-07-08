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
          className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm">{service.name}</span>
              <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[service.category]}</span>
            </div>
            {service.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{service.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(service.duration_minutes)}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-primary">{formatPrice(service.price_kzt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
