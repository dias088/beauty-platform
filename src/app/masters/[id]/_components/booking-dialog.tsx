'use client'

import { useState, useEffect } from 'react'
import { createBookingAction, getSlotsAction, getDiscountPreviewAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle2, Loader2, Tag } from 'lucide-react'

type ServiceItem = {
  id: string
  name: string
  price_kzt: number
  duration_minutes: number
}

type Slot = {
  id: string
  starts_at: string
  ends_at: string
}

export type DiscountPreview = {
  discount_pct: number
  final_price: number
  original_price: number
} | null

type Props = {
  masterId: string
  masterName: string
  services: ServiceItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'service' | 'date' | 'confirm' | 'success'

export function BookingDialog({ masterId, masterName, services, open, onOpenChange }: Props) {
  const [step, setStep]                   = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate]   = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot]   = useState<string>('')
  const [notes, setNotes]                 = useState('')
  const [slots, setSlots]                 = useState<Slot[]>([])
  const [loading, setLoading]             = useState(false)
  const [loadingSlots, setLoadingSlots]   = useState(false)
  const [discount, setDiscount]           = useState<DiscountPreview>(null)
  const [loadingDiscount, setLoadingDiscount] = useState(false)

  const service = services.find(s => s.id === selectedService)
  const slot    = slots.find(s => s.id === selectedSlot)

  // Загружаем превью скидки при выборе услуги
  useEffect(() => {
    if (!selectedService) {
      setDiscount(null)
      return
    }

    let cancelled = false
    setLoadingDiscount(true)

    getDiscountPreviewAction(masterId, selectedService).then(result => {
      if (!cancelled) {
        setDiscount(result)
        setLoadingDiscount(false)
      }
    })

    return () => { cancelled = true }
  }, [selectedService, masterId])

  const resetAndClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep('service')
      setSelectedService('')
      setSelectedDate(undefined)
      setSelectedSlot('')
      setNotes('')
      setSlots([])
      setDiscount(null)
    }, 300)
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    setSelectedSlot('')
    setLoadingSlots(true)

    try {
      const allSlots = await getSlotsAction(masterId)
      const daySlots = allSlots.filter(s => {
        const slotDate = parseISO(s.starts_at)
        return (
          slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth()    === date.getMonth()    &&
          slotDate.getDate()     === date.getDate()
        )
      })
      setSlots(daySlots)
    } catch {
      toast.error('Не удалось загрузить слоты')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedService || !selectedSlot) return

    setLoading(true)
    const result = await createBookingAction({
      master_id:    masterId,
      service_id:   selectedService,
      slot_id:      selectedSlot,
      client_notes: notes || undefined,
    })
    setLoading(false)

    if (result.success) {
      setStep('success')
    } else {
      toast.error(result.error)
      if (result.error.includes('уже занят')) {
        setSelectedSlot('')
        await handleDateSelect(selectedDate)
        setStep('date')
      }
    }
  }

  // Финальная цена для отображения
  const displayPrice    = discount ? discount.final_price    : service?.price_kzt ?? 0
  const originalPrice   = discount ? discount.original_price : null
  const discountPct     = discount ? discount.discount_pct   : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Запись к {masterName}</DialogTitle>
          <DialogDescription>
            {step === 'service' && 'Шаг 1 из 3 — Выберите услугу'}
            {step === 'date'    && 'Шаг 2 из 3 — Выберите дату и время'}
            {step === 'confirm' && 'Шаг 3 из 3 — Подтвердите запись'}
            {step === 'success' && 'Запись создана!'}
          </DialogDescription>
        </DialogHeader>

        {/* Сегментный прогресс шагов */}
        {step !== 'success' && (
          <div className="flex gap-1.5">
            {(['service', 'date', 'confirm'] as const).map((s, i) => {
              const idx = ['service', 'date', 'confirm'].indexOf(step)
              return (
                <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: i <= idx ? '100%' : '0%', background: 'var(--gradient-primary)' }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* ШАГ 1: Услуга */}
        {step === 'service' && (
          <div className="space-y-4">
            <Select value={selectedService} onValueChange={v => v && setSelectedService(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground ml-2">
                      — {s.price_kzt.toLocaleString('ru')} ₸ · {s.duration_minutes} мин
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Показываем скидку если есть */}
            {selectedService && (
              <DiscountBanner
                loading={loadingDiscount}
                discount={discount}
                originalPrice={service?.price_kzt ?? 0}
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetAndClose}>
                Отмена
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedService}
                onClick={() => setStep('date')}
              >
                Далее
              </Button>
            </div>
          </div>
        )}

        {/* ШАГ 2: Дата и время */}
        {step === 'date' && (
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
              locale={ru}
              className="rounded-md border w-full"
            />

            {selectedDate && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Время на {format(selectedDate, 'd MMMM', { locale: ru })}:
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3 border rounded-md">
                    Нет свободных слотов на эту дату
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSlot(s.id)}
                        className={`rounded-md border py-2 text-sm font-medium transition-all ${
                          selectedSlot === s.id
                            ? 'border-transparent text-white shadow-[var(--glow-violet)]'
                            : 'border-white/10 text-[var(--text-2)] hover:border-[var(--violet)]/50 hover:text-white'
                        }`}
                        style={
                          selectedSlot === s.id ? { background: 'var(--gradient-primary)' } : undefined
                        }
                      >
                        {format(parseISO(s.starts_at), 'HH:mm')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('service')}>
                Назад
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedSlot}
                onClick={() => setStep('confirm')}
              >
                Далее
              </Button>
            </div>
          </div>
        )}

        {/* ШАГ 3: Подтверждение */}
        {step === 'confirm' && service && selectedDate && slot && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Услуга</span>
                <span className="font-semibold">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата</span>
                <span className="font-semibold">
                  {format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Время</span>
                <span className="font-semibold">{format(parseISO(slot.starts_at), 'HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Длительность</span>
                <span className="font-semibold">{service.duration_minutes} мин</span>
              </div>

              {/* Цена с учётом скидки */}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-muted-foreground">Итого</span>
                <div className="flex items-center gap-2">
                  {originalPrice && discountPct > 0 && (
                    <span className="line-through text-muted-foreground text-xs">
                      {originalPrice.toLocaleString('ru')} ₸
                    </span>
                  )}
                  <span className={`font-bold text-base ${discountPct > 0 ? 'text-[#34d399]' : 'text-white'}`}>
                    {displayPrice.toLocaleString('ru')} ₸
                  </span>
                  {discountPct > 0 && (
                    <span className="rounded-full border border-[rgba(16,185,129,0.28)] bg-[rgba(16,185,129,0.12)] px-2 py-0.5 text-xs font-semibold text-[#34d399]">
                      -{discountPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Пожелания (необязательно)</label>
              <Textarea
                placeholder="Напишите пожелания мастеру..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={500}
                className="mt-2 resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {notes.length}/500
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('date')}>
                Назад
              </Button>
              <Button className="flex-1" onClick={handleBooking} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Подтвердить запись'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ШАГ 4: Успех */}
        {step === 'success' && (
          <div className="space-y-4 py-8 text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full animate-card-pop"
              style={{
                background: 'rgba(16,185,129,0.12)',
                boxShadow: '0 0 34px rgba(16,185,129,0.35)',
              }}
            >
              <CheckCircle2 className="h-9 w-9 text-[#34d399]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Запись создана!</p>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Мастер подтвердит вашу запись в ближайшее время
              </p>
            </div>
            <Button
              className="w-full border-0 text-white btn-primary-glow"
              onClick={resetAndClose}
            >
              Закрыть
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Баннер скидки ────────────────────────────────────────────────────────────

function DiscountBanner({
  loading,
  discount,
  originalPrice,
}: {
  loading: boolean
  discount: DiscountPreview
  originalPrice: number
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Проверяем скидку...
      </div>
    )
  }

  if (!discount || discount.discount_pct === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.09)] px-4 py-3">
      <Tag className="h-4 w-4 shrink-0 text-[#34d399]" />
      <div className="text-sm">
        <span className="font-semibold text-[#34d399]">
          Скидка {discount.discount_pct}% за Beauty Score!
        </span>
        <span className="ml-1 text-[#6ee7b7]">
          Цена {originalPrice.toLocaleString('ru')} →{' '}
          <strong>{discount.final_price.toLocaleString('ru')} ₸</strong>
        </span>
      </div>
    </div>
  )
}
