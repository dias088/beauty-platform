import { Badge } from '@/components/ui/badge'
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

const LEVEL_INFO = {
  new:      { emoji: '🆕', label: 'Новый',       className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-0' },
  verified: { emoji: '✅', label: 'Проверенный', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-0' },
  trusted:  { emoji: '⭐', label: 'Доверенный',  className: 'bg-green-100 text-green-800 hover:bg-green-100 border-0' },
}

export function BeautyScoreBadge({ level, score }: Props) {
  const info = LEVEL_INFO[level] ?? LEVEL_INFO.new

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={info.className}>
            {info.emoji} {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Beauty Score: <strong>{score}</strong></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
