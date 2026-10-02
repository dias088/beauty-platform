'use client'

import { useState } from 'react'
import { cancelClientBookingAction, addReviewAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2, ImagePlus, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
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
import Link from 'next/link'
import type { ClientBooking } from '@/lib/queries/client-bookings'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending:             { label: 'Ожидает подтверждения', variant: 'secondary' },
  confirmed:           { label: 'Подтверждена',          variant: 'default' },
  completed:           { label: 'Завершена',            variant: 'outline' },
  no_show:             { label: 'Не пришёл',             variant: 'destructive' },
  cancelled_by_client: { label: 'Отменена вами',         variant: 'outline' },
  cancelled_by_master: { label: 'Отменена мастером',     variant: 'outline' },
}

export function ClientBookingCard({
  booking,
  canCancel,
  masterAlreadyReviewed = false,
}: {
  booking: ClientBooking
  canCancel: boolean
  masterAlreadyReviewed?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const MAX_REVIEW_PHOTOS = 3

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Войдите снова'); return }

    const room = MAX_REVIEW_PHOTOS - reviewPhotos.length
    if (room <= 0) { toast.error(`Максимум ${MAX_REVIEW_PHOTOS} фото`); return }

    setPhotoUploading(true)
    try {
      for (const file of files.slice(0, room)) {
        if (file.size > 5242880) { toast.error(`${file.name} больше 5MB`); continue }
        const ext = file.name.split('.').pop()
        const path = `reviews/${user.id}/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('media').upload(path, file)
        if (error) { toast.error('Не удалось загрузить фото'); continue }
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
        setReviewPhotos(prev => [...prev, pub.publicUrl])
      }
    } finally {
      setPhotoUploading(false)
    }
  }

  const startDate = parseISO(booking.starts_at)
  const existingReview = booking.review ?? null
  const statusCfg = STATUS_LABELS[booking.status] ?? { label: booking.status, variant: 'outline' as const }

  const handleCancel = async () => {
    setLoading(true)
    const result = await cancelClientBookingAction(booking.id)
    setLoading(false)
    if (result.success) toast.success('Запись отменена')
    else toast.error(result.error)
  }

  const handleReview = async () => {
    if (!reviewRating) { toast.error('Выберите оценку'); return }
    setLoading(true)
    const result = await addReviewAction({
      booking_id: booking.id,
      rating: reviewRating,
      text: reviewText || undefined,
      photos: reviewPhotos,
    })
    setLoading(false)
    if (result.success) {
      toast.success('Отзыв опубликован!')
      setSubmitted(true)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card className="p-5">
      {/* Шапка */}
      <div className="flex gap-4 items-start mb-4">
        <Link href={`/masters/${booking.master_id}`} className="flex gap-3 flex-1 hover:opacity-80 transition-opacity min-w-0">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={booking.masters.profiles.avatar_url ?? undefined} />
            <AvatarFallback>{booking.masters.profiles.full_name[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{booking.masters.profiles.full_name}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{booking.masters.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{booking.service_name_snapshot}</p>
          </div>
        </Link>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1.5">
            {booking.original_price_kzt && (
              <span className="text-xs line-through text-muted-foreground">
                {booking.original_price_kzt.toLocaleString('ru')} ₸
              </span>
            )}
            <p className={`font-semibold ${booking.discount_pct ? 'text-[#34d399]' : ''}`}>
              {booking.price_kzt_snapshot.toLocaleString('ru')} ₸
            </p>
            {booking.discount_pct && (
              <span className="text-xs bg-[rgba(16,185,129,0.14)] text-[#34d399] px-1.5 py-0.5 rounded-full font-medium">
                -{booking.discount_pct}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(startDate, 'dd MMM, HH:mm', { locale: ru })}
          </p>
        </div>
      </div>

      <Badge variant={statusCfg.variant} className="mb-4">
        {statusCfg.label}
      </Badge>

      {/* Секция отзыва */}
      {booking.status === 'completed' && (
        <div className="border-t pt-4">
          {existingReview || submitted ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Ваш отзыв</p>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= (existingReview?.rating ?? reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'}`} />
                ))}
              </div>
              {existingReview?.text && (
                <p className="text-sm text-muted-foreground">{existingReview.text}</p>
              )}
              {existingReview?.photos && existingReview.photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingReview.photos.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative h-16 w-16 overflow-hidden rounded-md border border-white/10">
                      <Image src={url} alt={`Фото ${i + 1}`} fill className="object-cover" sizes="64px" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : masterAlreadyReviewed ? (
            <p className="text-sm text-muted-foreground">Вы уже оставили отзыв этому мастеру</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Оставьте отзыв о визите:</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-125"
                    type="button"
                  >
                    <Star className={`w-7 h-7 transition-colors ${star <= (hoveredStar || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'}`} />
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground self-center">
                    {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично!'][reviewRating]}
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Расскажите о вашем опыте..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                maxLength={1000}
                rows={3}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{reviewText.length}/1000</p>

              {/* Фото к отзыву */}
              <div className="flex flex-wrap items-center gap-2">
                {reviewPhotos.map((url, i) => (
                  <div key={url} className="relative h-16 w-16">
                    <Image src={url} alt={`Фото ${i + 1}`} fill className="rounded-md object-cover" sizes="64px" />
                    <button
                      type="button"
                      onClick={() => setReviewPhotos(prev => prev.filter(u => u !== url))}
                      aria-label="Убрать фото"
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {reviewPhotos.length < MAX_REVIEW_PHOTOS && (
                  <label className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/20 text-muted-foreground transition-colors hover:border-[var(--violet)]/50 ${photoUploading ? 'pointer-events-none opacity-60' : ''}`}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoPick} disabled={photoUploading} />
                    {photoUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  </label>
                )}
                <span className="text-xs text-muted-foreground">Фото по желанию · до {MAX_REVIEW_PHOTOS}</span>
              </div>

              <button
                onClick={handleReview}
                disabled={loading || photoUploading || !reviewRating}
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</> : 'Отправить отзыв'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Кнопка отмены */}
      {canCancel && booking.status !== 'cancelled_by_client' && booking.status !== 'cancelled_by_master' && (
        <div className="border-t pt-4 mt-4">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  disabled={loading}
                  className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Отменить запись
                </button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
                <AlertDialogDescription>
                  Отменить можно только за 24 часа до начала. Слот освободится.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Не отменять</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>
                  Отменить запись
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  )
}
