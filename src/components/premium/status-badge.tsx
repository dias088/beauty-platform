import { cn } from '@/lib/utils'

/**
 * Pill-бейдж статуса: полупрозрачная заливка цвета + цветной текст.
 * Используется для статусов записей (подтверждена / ожидает / отменена)
 * и любых меток. Без мигания.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'violet' | 'neutral'

const TONES: Record<StatusTone, string> = {
  success: 'bg-[rgba(16,185,129,0.12)] text-[#34d399] border-[rgba(16,185,129,0.25)]',
  warning: 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border-[rgba(251,191,36,0.25)]',
  danger: 'bg-[rgba(239,68,68,0.12)] text-[#f87171] border-[rgba(239,68,68,0.25)]',
  violet: 'bg-[rgba(167,139,250,0.12)] text-[#c4b5fd] border-[rgba(167,139,250,0.28)]',
  neutral: 'bg-white/5 text-[var(--text-2)] border-white/10',
}

export function StatusBadge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: React.ReactNode
  tone?: StatusTone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs font-semibold tracking-tight whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="status-dot h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
