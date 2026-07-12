import { Sparkles, BadgeCheck, ShieldCheck, type LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Props = {
  level: 'new' | 'verified' | 'trusted'
  score: number
}

const LEVEL_INFO: Record<string, { icon: LucideIcon; label: string; className: string }> = {
  new: {
    icon: Sparkles,
    label: 'Новый',
    className: 'bg-[rgba(96,165,250,0.12)] text-[#93c5fd] border-[rgba(96,165,250,0.28)]',
  },
  verified: {
    icon: BadgeCheck,
    label: 'Проверенный',
    className: 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border-[rgba(251,191,36,0.28)]',
  },
  trusted: {
    icon: ShieldCheck,
    label: 'Доверенный',
    className: 'bg-[rgba(16,185,129,0.12)] text-[#34d399] border-[rgba(16,185,129,0.28)]',
  },
}

export function BeautyScoreBadge({ level, score }: Props) {
  const info = LEVEL_INFO[level] ?? LEVEL_INFO.new
  const Icon = info.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${info.className}`}
          >
            <Icon className="h-3 w-3" /> {info.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Beauty Score: <strong>{score}</strong></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
