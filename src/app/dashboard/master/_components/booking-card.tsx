'use client'

import { useState } from 'react'
import { confirmBookingAction, completeBookingAction, cancelBookingAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import type { MasterBooking } from '@/lib/queries/master-bookings'
import { BeautyScoreBadge } from '@/components/shared/beauty-score-badge'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending:              { label: 'Ожидание',           variant: 'secondary' },
  confirmed:            { label: 'Подтверждена',        variant: 'default' },
  completed:            { label: 'Завершена',          variant: 'outline' },
  no_show:              { label: 'Не пришёл',           variant: 'destructive' },
  cancelled_by_client:  { label: 'Отменена клиентом',  variant: 'outline' },
  cancelled_by_master:  { label: 'Отменена мастером',  variant: 'outline' },
}

export function BookingCard({ booking }: { booking: MasterBooking }) {
  const [loading, setLoading] = useState(false)
  const startDate = parseISO(booking.starts_at)
  const isUpcoming = startDate > new Date()
  const statusCfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, variant: 'outline' as const }

  const withLoading = async (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setLoading(true)
    const result = await fn()
    setLoading(false)
    if (result.success) {
      toast.success('Готово!')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={booking.profiles.avatar_url ?? undefined} />
          <AvatarFallback>{booking.profiles.full_name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold">{booking.profiles.full_name}</span>
            {booking.client_scores && (
              <BeautyScoreBadge
                level={booking.client_scores.level as 'new' | 'verified' | 'trusted'}
                score={booking.client_scores.score}
              />
            )}
            <Badge variant={statusCfg.variant} className="text-xs">
              {statusCfg.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {booking.service_name_snapshot} · {booking.price_kzt_snapshot.toLocaleString('ru')} ₸
          </p>

          <p className="text-sm font-medium mt-1">
            {format(startDate, 'dd MMMM (EEEE) в HH:mm', { locale: ru })}
          </p>

          {booking.client_notes && (
            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded p-2">
              {booking.client_notes}
            </p>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col gap-2 shrink-0">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}

          {!loading && booking.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => withLoading(() => confirmBookingAction(booking.id))}>
                Подтвердить
              </Button>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button size="sm" variant="outline">Отклонить</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отклонить запись?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Слот освободится, клиент сможет выбрать другое время.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Назад</AlertDialogCancel>
                    <AlertDialogAction onClick={() => withLoading(() => cancelBookingAction(booking.id))}>
                      Отклонить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {!loading && booking.status === 'confirmed' && !isUpcoming && (
            <Button size="sm" onClick={() => withLoading(() => completeBookingAction(booking.id))}>
              Завершить
            </Button>
          )}

          {!loading && booking.status === 'confirmed' && isUpcoming && (
            <AlertDialog>
              <AlertDialogTrigger>
                <Button size="sm" variant="outline">Отменить</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Слот освободится. Клиент получит уведомление.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Назад</AlertDialogCancel>
                  <AlertDialogAction onClick={() => withLoading(() => cancelBookingAction(booking.id))}>
                    Отменить запись
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </Card>
  )
}
