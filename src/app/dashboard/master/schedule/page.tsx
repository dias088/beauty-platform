'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlotsAction, deleteSlotAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Trash2, Plus, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react'

// ─── Типы ────────────────────────────────────────────────────────────────────

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

type WeekTemplate = Record<number, DayTemplate> // 0=Вс, 1=Пн, ..., 6=Сб

const DEFAULT_DAY: DayTemplate = { enabled: false, startTime: '09:00', endTime: '18:00', slotDuration: 60 }

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function generateSlotsFromTemplate(template: WeekTemplate, weekStart: Date) {
  const result: { date: Date; starts: string; ends: string }[] = []
  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d)
    const dow = day.getDay()
    const cfg = template[dow]
    if (!cfg?.enabled) continue

    const [sh, sm] = cfg.startTime.split(':').map(Number)
    const [eh, em] = cfg.endTime.split(':').map(Number)
    let cur = new Date(day)
    cur.setHours(sh, sm, 0, 0)
    const end = new Date(day)
    end.setHours(eh, em, 0, 0)

    while (cur < end) {
      const slotEnd = new Date(cur.getTime() + cfg.slotDuration * 60000)
      if (slotEnd > end) break
      result.push({
        date: new Date(cur),
        starts: cur.toISOString(),
        ends: slotEnd.toISOString(),
      })
      cur = slotEnd
    }
  }
  return result
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [tab, setTab] = useState<'week' | 'template'>('week')

  const [template, setTemplate] = useState<WeekTemplate>(() => {
    const t: WeekTemplate = {}
    for (let i = 0; i < 7; i++) t[i] = { ...DEFAULT_DAY }
    // Пн-Пт включены по умолчанию
    ;[1, 2, 3, 4, 5].forEach(d => { t[d] = { enabled: true, startTime: '09:00', endTime: '18:00', slotDuration: 60 } })
    return t
  })

  const supabase = createClient()

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { loadSlots() }, [weekOffset])

  const loadSlots = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
    if (!master) return

    const from = weekStart.toISOString()
    const to   = addDays(weekStart, 7).toISOString()

    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('master_id', master.id)
      .gte('starts_at', from)
      .lt('starts_at', to)
      .order('starts_at', { ascending: true })

    setSlots(data ?? [])
  }

  const handleGenerateWeek = async () => {
    const preview = generateSlotsFromTemplate(template, weekStart)
    if (preview.length === 0) {
      toast.error('Нет рабочих дней в шаблоне')
      return
    }

    setGenerating(true)
    let created = 0
    let errors  = 0

    for (const s of preview) {
      // Используем существующий action: 1 слот = 1 вызов
      const dateStr = format(s.date, 'yyyy-MM-dd')
      const timeStr = format(s.date, 'HH:mm')
      const result = await generateSlotsAction(1, dateStr, timeStr,
        template[s.date.getDay()].slotDuration,
        template[s.date.getDay()].slotDuration)
      if (result.success) created++
      else errors++
    }

    setGenerating(false)
    if (created > 0) toast.success(`Создано ${created} слотов${errors > 0 ? `, ошибок: ${errors}` : ''}`)
    else toast.error('Не удалось создать слоты')
    loadSlots()
  }

  const handleDelete = async (slotId: string) => {
    setLoading(true)
    const result = await deleteSlotAction(slotId)
    setLoading(false)
    if (result.success) {
      toast.success('Слот удалён')
      setSlots(prev => prev.filter(s => s.id !== slotId))
    } else {
      toast.error(result.error)
    }
  }

  const slotsForDay = (day: Date) => slots.filter(s => isSameDay(parseISO(s.starts_at), day))

  return (
    <main className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Расписание</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Управляй слотами и шаблоном рабочей недели</p>
        </div>
        {/* Табы */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(['week', 'template'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'week' ? '📅 Неделя' : '⚙️ Шаблон'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB: НЕДЕЛЯ ──────────────────────────────────────────── */}
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
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const daySlots  = slotsForDay(day)
              const booked    = daySlots.filter(s => s.is_booked).length
              const free      = daySlots.filter(s => !s.is_booked).length
              const isToday   = isSameDay(day, new Date())
              const isPast    = day < new Date(new Date().setHours(0,0,0,0))
              const isSelected = selectedDay && isSameDay(day, selectedDay)

              return (
                <button key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={[
                    'flex flex-col items-center p-2 rounded-xl border transition-all text-center',
                    isSelected  ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-border hover:border-violet-200',
                    isToday     ? 'ring-2 ring-violet-400 ring-offset-1' : '',
                    isPast      ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  <span className="text-xs text-muted-foreground">{DAY_NAMES[day.getDay()]}</span>
                  <span className={`text-lg font-bold my-0.5 ${isToday ? 'text-violet-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {daySlots.length > 0 ? (
                    <div className="flex gap-1 flex-wrap justify-center">
                      {free > 0   && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">{free}</span>}
                      {booked > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{booked}🔒</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Детали дня */}
          {selectedDay && (
            <Card className="p-5">
              <h2 className="font-semibold mb-4">
                {format(selectedDay, 'EEEE, d MMMM', { locale: ru })}
              </h2>
              {slotsForDay(selectedDay).length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет слотов. Перейди в «Шаблон» и нажми «Создать неделю».</p>
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
                          : <Badge variant="outline" className="text-xs text-green-700 border-green-300">Свободен</Badge>
                        }
                      </div>
                      {!slot.is_booked && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)} disabled={loading}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Быстрое создание недели */}
          <Card className="p-5 border-dashed border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Создать слоты по шаблону</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Применить шаблон к выбранной неделе ({format(weekStart, 'd MMM', { locale: ru })} — {format(addDays(weekStart, 6), 'd MMM', { locale: ru })})
                </p>
              </div>
              <Button onClick={handleGenerateWeek} disabled={generating} size="sm">
                {generating ? 'Создание...' : <><Plus className="w-4 h-4 mr-1.5" />Создать неделю</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB: ШАБЛОН ─────────────────────────────────────────── */}
      {tab === 'template' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            Настрой стандартный рабочий день для каждого дня недели.
            Шаблон применяется при нажатии «Создать неделю».
          </p>
          {[1, 2, 3, 4, 5, 6, 0].map(dow => {
            const cfg = template[dow]
            return (
              <Card key={dow} className={`p-4 transition-opacity ${!cfg.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Toggle */}
                  <button
                    onClick={() => setTemplate(t => ({ ...t, [dow]: { ...t[dow], enabled: !t[dow].enabled } }))}
                    className={`w-28 text-left font-semibold text-sm flex items-center gap-2 ${cfg.enabled ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 transition-colors ${cfg.enabled ? 'bg-violet-500 border-violet-500' : 'bg-transparent border-muted-foreground/40'}`} />
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
                        <span className="text-xs text-muted-foreground">
                          ≈ {Math.floor((
                            (Number(cfg.endTime.split(':')[0]) * 60 + Number(cfg.endTime.split(':')[1])) -
                            (Number(cfg.startTime.split(':')[0]) * 60 + Number(cfg.startTime.split(':')[1]))
                          ) / cfg.slotDuration)} слотов
                        </span>
                      </div>
                    </>
                  )}
                  {!cfg.enabled && <span className="text-xs text-muted-foreground">Выходной</span>}
                </div>
              </Card>
            )
          })}

          <div className="pt-2">
            <Button onClick={() => { setTab('week'); toast.success('Шаблон сохранён! Теперь создай неделю.') }} className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Сохранить шаблон и перейти к неделе
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
