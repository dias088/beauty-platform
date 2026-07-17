'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createSlotsAction,
  deleteSlotAction,
  getScheduleTemplateAction,
  saveScheduleTemplateAction,
} from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Trash2, Plus, ChevronLeft, ChevronRight, Clock, Calendar, AlertCircle, Settings2, Lock } from 'lucide-react'

type Slot = {
  id: string
  starts_at: string
  ends_at: string
  is_booked: boolean
}

type DayTemplate = {
  enabled: boolean
  startTime: string
  endTime: string
  slotDuration: number
}

type WeekTemplate = Record<number, DayTemplate>

const DEFAULT_DAY: DayTemplate = { enabled: false, startTime: '09:00', endTime: '18:00', slotDuration: 60 }
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

function createDefaultTemplate(): WeekTemplate {
  const template: WeekTemplate = {}
  for (let day = 0; day < 7; day++) template[day] = { ...DEFAULT_DAY }
  ;[1, 2, 3, 4, 5].forEach(day => {
    template[day] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 60 }
  })
  return template
}

function generateSlotsForDay(date: Date, cfg: DayTemplate): { starts: string; ends: string }[] {
  const result: { starts: string; ends: string }[] = []
  const [sh, sm] = cfg.startTime.split(':').map(Number)
  const [eh, em] = cfg.endTime.split(':').map(Number)

  // Начинаем с начала рабочего дня, НЕ с текущего времени
  const dayStart = new Date(date)
  dayStart.setHours(sh, sm, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(eh, em, 0, 0)

  // Если день уже прошёл целиком — пропускаем
  if (dayEnd < new Date()) return []

  let cur = new Date(dayStart)
  while (cur < dayEnd) {
    const slotEnd = new Date(cur.getTime() + cfg.slotDuration * 60000)
    if (slotEnd > dayEnd) break
    // Добавляем все слоты дня включая прошедшие — сервер сам отклонит прошедшие
    result.push({ starts: cur.toISOString(), ends: slotEnd.toISOString() })
    cur = slotEnd
  }
  return result
}

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [generating, setGenerating] = useState(false)
  const [deletingDay, setDeletingDay] = useState(false)
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [tab, setTab] = useState<'week' | 'template'>('week')

  const [template, setTemplate] = useState<WeekTemplate>(createDefaultTemplate)

  const supabase = createClient()
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { loadSlots() }, [weekOffset])
  useEffect(() => { loadTemplate() }, [])

  const loadSlots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
    if (!master) return

    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()

    const { data } = await supabase
      .from('slots').select('*').eq('master_id', master.id)
      .gte('starts_at', from).lt('starts_at', to)
      .order('starts_at', { ascending: true })

    setSlots(data ?? [])
  }

  const loadTemplate = async () => {
    const result = await getScheduleTemplateAction()
    // When a master has not saved a template yet, the useful weekday default stays in place.
    if (!result.success || result.data.length === 0) return

    setTemplate(previous => {
      const next = { ...previous }
      for (const day of result.data) {
        next[day.weekday] = {
          enabled: day.enabled,
          startTime: day.startTime,
          endTime: day.endTime,
          slotDuration: day.slotDuration,
        }
      }
      return next
    })
  }

  const handleSaveTemplate = async () => {
    setSavingTemplate(true)
    const result = await saveScheduleTemplateAction(
      Object.entries(template).map(([weekday, day]) => ({
        weekday: Number(weekday),
        enabled: day.enabled,
        startTime: day.startTime,
        endTime: day.endTime,
        slotDuration: day.slotDuration,
      }))
    )
    setSavingTemplate(false)

    if (result.success) {
      toast.success('Шаблон сохранён')
      setTab('week')
    } else {
      toast.error(result.error)
    }
  }

  // Создать слоты для одного дня
  const handleGenerateDay = async (day: Date) => {
    const dow = day.getDay()
    const cfg = template[dow]
    if (!cfg.enabled) {
      toast.error('Этот день выключен в шаблоне')
      return
    }

    const preview = generateSlotsForDay(day, cfg)
    if (preview.length === 0) {
      toast.error('Нет слотов для создания — день уже прошёл')
      return
    }

    setGenerating(true)
    const result = await createSlotsAction(preview)
    setGenerating(false)

    if (result.success) {
      toast.success(`Создано ${result.data.created} слотов на ${format(day, 'd MMMM', { locale: ru })}`)
      loadSlots()
    } else {
      toast.error(result.error)
    }
  }

  // Создать слоты на всю неделю
  const handleGenerateWeek = async () => {
    const all: { starts: string; ends: string }[] = []
    for (const day of weekDays) {
      const dow = day.getDay()
      const cfg = template[dow]
      if (!cfg.enabled) continue
      all.push(...generateSlotsForDay(day, cfg))
    }

    if (all.length === 0) {
      toast.error('Нет слотов для создания')
      return
    }

    setGenerating(true)
    const result = await createSlotsAction(all)
    setGenerating(false)

    if (result.success) {
      toast.success(`Создано ${result.data.created} слотов на неделю`)
      loadSlots()
    } else {
      toast.error(result.error)
    }
  }

  // Удалить все свободные слоты за день
  const handleDeleteDay = async (day: Date) => {
    const daySlots = slotsForDay(day).filter(s => !s.is_booked)
    if (daySlots.length === 0) {
      toast.error('Нет свободных слотов для удаления')
      return
    }

    setDeletingDay(true)
    let deleted = 0
    for (const slot of daySlots) {
      const result = await deleteSlotAction(slot.id)
      if (result.success) deleted++
    }
    setDeletingDay(false)

    toast.success(`Удалено ${deleted} слотов`)
    setSlots(prev => prev.filter(s =>
      !daySlots.find(ds => ds.id === s.id)
    ))
  }

  // Удалить все свободные слоты за неделю
  const handleDeleteWeek = async () => {
    const freeSlots = slots.filter(s => !s.is_booked)
    if (freeSlots.length === 0) {
      toast.error('Нет свободных слотов для удаления')
      return
    }

    setDeletingDay(true)
    let deleted = 0
    for (const slot of freeSlots) {
      const result = await deleteSlotAction(slot.id)
      if (result.success) deleted++
    }
    setDeletingDay(false)

    toast.success(`Удалено ${deleted} слотов за неделю`)
    setSlots(prev => prev.filter(s => s.is_booked))
  }

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingSlot(slotId)
    const result = await deleteSlotAction(slotId)
    setDeletingSlot(null)
    if (result.success) {
      toast.success('Слот удалён')
      setSlots(prev => prev.filter(s => s.id !== slotId))
    } else {
      toast.error(result.error)
    }
  }

  const slotsForDay = (day: Date) =>
    slots.filter(s => isSameDay(parseISO(s.starts_at), day))

  return (
    <main className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Расписание</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Управляй слотами и шаблоном рабочей недели</p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(['week', 'template'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'week' ? <Calendar className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
              {t === 'week' ? 'Неделя' : 'Шаблон'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'week' && (
        <div className="space-y-4">
          {/* Навигация по неделям */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm">
              {format(weekStart, 'd MMM', { locale: ru })} — {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}
              {weekOffset === 0 && <Badge className="ml-2 text-xs" variant="outline">Эта неделя</Badge>}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Сетка дней */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map(day => {
              const daySlots = slotsForDay(day)
              const booked = daySlots.filter(s => s.is_booked).length
              const free = daySlots.filter(s => !s.is_booked).length
              const isToday = isSameDay(day, new Date())
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
              const isSelected = selectedDay && isSameDay(day, selectedDay)

              return (
                <button key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={[
                    'flex flex-col items-center p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all text-center',
                    isSelected ? 'border-[var(--violet)] bg-[rgba(167,139,250,0.1)]' : 'border-border hover:border-[var(--violet)]/40',
                    isToday ? 'ring-2 ring-[#FF87B2] ring-offset-1' : '',
                    isPast ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{DAY_NAMES[day.getDay()]}</span>
                  <span className={`text-base sm:text-lg font-bold my-0.5 ${isToday ? 'text-[#FF2D78]' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {daySlots.length > 0 ? (
                    <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                      {free > 0 && <span className="text-[10px] sm:text-xs bg-[rgba(16,185,129,0.14)] text-[#34d399] px-1 rounded">{free}</span>}
                      {booked > 0 && <span className="text-[10px] sm:text-xs bg-[rgba(96,165,250,0.14)] text-[#93c5fd] px-1 rounded inline-flex items-center gap-0.5">{booked}<Lock className="w-2.5 h-2.5" /></span>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Детали выбранного дня */}
          {selectedDay ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  {format(selectedDay, 'EEEE, d MMMM', { locale: ru })}
                </h2>
                <div className="flex gap-2">
                  {/* Создать слоты только на этот день */}
                  <Button size="sm" variant="outline" onClick={() => handleGenerateDay(selectedDay)} disabled={generating}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {generating ? 'Создание...' : 'Создать день'}
                  </Button>
                  {/* Удалить все свободные за день */}
                  {slotsForDay(selectedDay).filter(s => !s.is_booked).length > 0 && (
                    <Button size="sm" variant="outline"
                      onClick={() => handleDeleteDay(selectedDay)}
                      disabled={deletingDay}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {deletingDay ? 'Удаление...' : 'Удалить день'}
                    </Button>
                  )}
                </div>
              </div>

              {slotsForDay(selectedDay).length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <AlertCircle className="w-4 h-4" />
                  Нет слотов. Нажми «Создать день» чтобы добавить.
                </div>
              ) : (
                <div className="space-y-2">
                  {slotsForDay(selectedDay).map(slot => (
                    <div key={slot.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {format(parseISO(slot.starts_at), 'HH:mm')} — {format(parseISO(slot.ends_at), 'HH:mm')}
                        </span>
                        {slot.is_booked
                          ? <Badge variant="default" className="text-xs">Забронирован</Badge>
                          : <Badge variant="outline" className="text-xs text-[#34d399] border-[rgba(16,185,129,0.3)]">Свободен</Badge>
                        }
                      </div>
                      {!slot.is_booked && (
                        <Button variant="ghost" size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={deletingSlot === slot.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-4 border-dashed border-2">
              <p className="text-sm text-muted-foreground text-center">
                Нажми на день выше, чтобы создать или удалить слоты <span className="text-foreground font-medium">для одного конкретного дня</span>
              </p>
            </Card>
          )}

          {/* Кнопки создать/удалить неделю */}
          <Card className="p-5 border-dashed border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Вся неделя сразу</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(weekStart, 'd MMM', { locale: ru })} — {format(addDays(weekStart, 6), 'd MMM', { locale: ru })}
                </p>
              </div>
              <div className="flex gap-2">
                {slots.filter(s => !s.is_booked).length > 0 && (
                  <Button variant="outline" size="sm"
                    onClick={handleDeleteWeek}
                    disabled={deletingDay}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {deletingDay ? 'Удаление...' : 'Удалить неделю'}
                  </Button>
                )}
                <Button onClick={handleGenerateWeek} disabled={generating} size="sm">
                  {generating ? 'Создание...' : <><Plus className="w-4 h-4 mr-1.5" />Создать неделю</>}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'template' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] rounded-lg text-sm text-[#bfdbfe] mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Слоты создаются с начала рабочего дня по расписанию. Если день частично прошёл — слоты за прошедшее время не создаются.
          </div>

          {[1, 2, 3, 4, 5, 6, 0].map(dow => {
            const cfg = template[dow]
            const startH = Number(cfg.startTime.split(':')[0])
            const startM = Number(cfg.startTime.split(':')[1])
            const endH = Number(cfg.endTime.split(':')[0])
            const endM = Number(cfg.endTime.split(':')[1])
            const totalMins = (endH * 60 + endM) - (startH * 60 + startM)
            const slotsCount = cfg.enabled ? Math.floor(totalMins / cfg.slotDuration) : 0

            return (
              <Card key={dow} className={`p-4 transition-opacity ${!cfg.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setTemplate(t => ({ ...t, [dow]: { ...t[dow], enabled: !t[dow].enabled } }))}
                    className={`w-28 text-left font-semibold text-sm flex items-center gap-2 ${cfg.enabled ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 transition-colors ${cfg.enabled ? 'bg-[#FF5C97] border-[#FF5C97]' : 'bg-transparent border-muted-foreground/40'}`} />
                    {DAY_NAMES_FULL[dow]}
                  </button>

                  {cfg.enabled && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="text-muted-foreground text-xs">с</label>
                        <input type="time" value={cfg.startTime}
                          onChange={e => setTemplate(t => ({ ...t, [dow]: { ...t[dow], startTime: e.target.value } }))}
                          className="border rounded-md px-2 py-1 text-sm bg-background" />
                        <label className="text-muted-foreground text-xs">до</label>
                        <input type="time" value={cfg.endTime}
                          onChange={e => setTemplate(t => ({ ...t, [dow]: { ...t[dow], endTime: e.target.value } }))}
                          className="border rounded-md px-2 py-1 text-sm bg-background" />
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-auto">
                        <label className="text-muted-foreground text-xs">Слот</label>
                        <select value={cfg.slotDuration}
                          onChange={e => setTemplate(t => ({ ...t, [dow]: { ...t[dow], slotDuration: Number(e.target.value) } }))}
                          className="border rounded-md px-2 py-1 text-sm bg-background">
                          {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} мин</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground">≈ {slotsCount} слотов</span>
                      </div>
                    </>
                  )}
                  {!cfg.enabled && <span className="text-xs text-muted-foreground">Выходной</span>}
                </div>
              </Card>
            )
          })}

          <div className="pt-2">
            <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Сохранить шаблон и перейти к неделе
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
