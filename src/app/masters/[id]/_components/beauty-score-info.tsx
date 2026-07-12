import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

export function BeautyScoreInfo() {
  return (
    <Alert className="border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.08)]">
      <InfoIcon className="h-4 w-4 text-[#93c5fd]" />
      <AlertDescription className="text-[#bfdbfe] text-sm">
        <strong>Beauty Score</strong> — система репутации клиентов. Мастер видит уровень каждого клиента (Новый, Проверенный, Доверенный). Выполняйте записи и оставляйте отзывы, чтобы повысить свой рейтинг!
      </AlertDescription>
    </Alert>
  )
}
