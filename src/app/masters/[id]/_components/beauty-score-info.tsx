import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

export function BeautyScoreInfo() {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 text-sm">
        <strong>Beauty Score</strong> — система репутации клиентов. Мастер видит уровень каждого клиента (Новый, Проверенный, Доверенный). Выполняйте записи и оставляйте отзывы, чтобы повысить свой рейтинг!
      </AlertDescription>
    </Alert>
  )
}
