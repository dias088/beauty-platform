'use client'

import { useRouter, usePathname } from 'next/navigation'

const PERIODS = [
  { value: '7d',  label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'all', label: 'Всё время' },
]

export function PeriodFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => router.replace(`${pathname}?period=${p.value}`)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            current === p.value
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
