'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Lightbulb } from 'lucide-react'
import { saveBasicsAction, saveLocationAction } from '../actions'

const CATEGORIES = [
  { value: 'nail',        label: 'Маникюр' },
  { value: 'lash',        label: 'Ресницы' },
  { value: 'brow',        label: 'Брови' },
  { value: 'hair',        label: 'Волосы' },
  { value: 'makeup',      label: 'Макияж' },
  { value: 'cosmetology', label: 'Косметология' },
]

const STEPS = [
  { num: 1, label: 'О вас' },
  { num: 2, label: 'Услуги' },
  { num: 3, label: 'Адрес' },
  { num: 4, label: 'Готово' },
]

type Props = { step: number; masterInfo: any; userName: string }

export function OnboardingFlow({ step: initialStep, masterInfo, userName }: Props) {
  const router = useRouter()
  const [step, setStep]       = useState(initialStep)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [bio, setBio]               = useState(masterInfo?.bio ?? '')
  const [instagram, setInstagram]   = useState(masterInfo?.instagram_handle ?? '')
  const [categories, setCategories] = useState<string[]>(masterInfo?.categories ?? [])

  // Step 2 (быстрая услуга)
  const [serviceName, setServiceName]         = useState('')
  const [servicePrice, setServicePrice]       = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [serviceCategory, setServiceCategory] = useState('')

  // Step 3
  const [address, setAddress] = useState(masterInfo?.address ?? '')

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleStep1 = async () => {
    if (!bio.trim() || bio.length < 20) { toast.error('Напишите о себе (минимум 20 символов)'); return }
    if (categories.length === 0) { toast.error('Выберите хотя бы одну категорию'); return }
    setLoading(true)
    const result = await saveBasicsAction(bio, categories, instagram || undefined)
    setLoading(false)
    if (result.success) nextStep()
    else toast.error(result.error)
  }

  const handleStep2 = async () => {
    // Услуга опциональна на онбординге — можно добавить потом
    nextStep()
  }

  const handleStep3 = async () => {
    setLoading(true)
    // Адрес тоже можно добавить позже
    setLoading(false)
    nextStep()
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Логотип / заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[rgba(167,139,250,0.12)] text-[#c4b5fd] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Настройка профиля
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step < 4 ? `Привет, ${userName.split(' ')[0]}!` : 'Всё готово!'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step < 4 ? 'Осталось буквально пару минут' : 'Твой профиль создан'}
          </p>
        </div>

        {/* Прогресс */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map(s => (
                <div key={s.num} className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.num ? 'bg-[#FF2D78] text-white' :
                    step === s.num ? 'bg-[#FF2D78] text-white ring-4 ring-[rgba(167,139,250,0.2)]' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-xs ${step === s.num ? 'text-[#FF2D78] font-medium' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-[#FF2D78] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ─── ШАГ 1: О себе ──────────────────────────────────────── */}
        {step === 1 && (
          <Card className="p-6 space-y-5 shadow-sm">
            <div>
              <label className="text-sm font-medium block mb-2">Расскажите о себе</label>
              <Textarea
                placeholder="Опытный мастер маникюра с 5-летним стажем. Работаю с гель-лаком, акрилом..."
                value={bio} onChange={e => setBio(e.target.value)}
                rows={4} className="resize-none"
              />
              <p className={`text-xs mt-1 ${bio.length > 0 && bio.length < 20 ? 'text-[#f87171]' : 'text-muted-foreground'}`}>
                {bio.length < 20 ? `Ещё минимум ${20 - bio.length} символов` : `${bio.length} символов`}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-3">Ваши специализации</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.value}
                    onClick={() => setCategories(prev =>
                      prev.includes(cat.value) ? prev.filter(c => c !== cat.value) : [...prev, cat.value]
                    )}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                      categories.includes(cat.value)
                        ? 'border-[var(--violet)] bg-[rgba(167,139,250,0.1)] text-[#c4b5fd]'
                        : 'border-border hover:border-[var(--violet)]/40'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Instagram (необязательно)</label>
              <Input placeholder="@username" value={instagram} onChange={e => setInstagram(e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleStep1} disabled={loading}>
              {loading ? 'Сохранение...' : <>Далее <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </Card>
        )}

        {/* ─── ШАГ 2: Первая услуга ───────────────────────────────── */}
        {step === 2 && (
          <Card className="p-6 space-y-5 shadow-sm">
            <div className="bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] rounded-xl p-4 text-sm text-[#bfdbfe] flex gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Добавьте хотя бы одну услугу — клиенты увидят её при записи.
              Всё можно изменить в разделе «Услуги».</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-2">Название услуги</label>
                <Input placeholder="Маникюр с покрытием" value={serviceName}
                  onChange={e => setServiceName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Цена (₸)</label>
                <Input type="number" placeholder="5000" value={servicePrice}
                  onChange={e => setServicePrice(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Длительность</label>
                <select value={serviceDuration} onChange={e => setServiceDuration(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  {[30,45,60,90,120].map(m => <option key={m} value={m}>{m} мин</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-2">Категория</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const c = CATEGORIES.find(x => x.value === cat)
                    return c ? (
                      <button key={cat} onClick={() => setServiceCategory(cat)}
                        className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                          serviceCategory === cat ? 'border-[var(--violet)] bg-[rgba(167,139,250,0.1)]' : 'border-border'
                        }`}>
                        {c.label}
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Назад
              </Button>
              <Button className="flex-1" onClick={handleStep2}>
                {serviceName ? 'Сохранить и далее' : 'Пропустить'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ─── ШАГ 3: Адрес ───────────────────────────────────────── */}
        {step === 3 && (
          <Card className="p-6 space-y-5 shadow-sm">
            <div>
              <label className="text-sm font-medium block mb-2">Адрес приёма клиентов</label>
              <Input placeholder="ул. Кунаева, 12, офис 305, Астана"
                value={address} onChange={e => setAddress(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-2">
                Отображается на карте для клиентов. Можно добавить позже в настройках.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Назад
              </Button>
              <Button className="flex-1" onClick={handleStep3} disabled={loading}>
                {address ? 'Сохранить и завершить' : 'Пропустить'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ─── ШАГ 4: Успех ───────────────────────────────────────── */}
        {step === 4 && (
          <Card className="p-8 text-center shadow-sm space-y-6">
            <div className="w-20 h-20 bg-[rgba(16,185,129,0.14)] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Профиль создан!</h2>
              <p className="text-muted-foreground text-sm">
                Теперь настрой расписание — и первые клиенты смогут записаться к тебе уже сегодня.
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/dashboard/master/schedule')}>
                Настроить расписание <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/master')}>
                Перейти в дашборд
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
