'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Lightbulb, Loader2, MapPin } from 'lucide-react'
import { addServiceAction, saveBasicsAction, saveOnboardingLocationAction } from '../actions'
import { useAddressSuggest } from '@/hooks/use-address-suggest'
import { LocationPicker } from '@/components/shared/location-picker'

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
  const [serviceCreated, setServiceCreated]   = useState(false)

  // Step 3
  const [addressQuery, setAddressQuery] = useState(masterInfo?.address ?? '')
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(
    typeof masterInfo?.lat === 'number' && typeof masterInfo?.lng === 'number'
      ? { lat: masterInfo.lat, lng: masterInfo.lng }
      : null
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  // true — маркер поставлен вручную (клик/перетаскивание/выбор подсказки),
  // тогда живой предпросмотр по вводу не перебивает выбор пользователя.
  const [pinnedManually, setPinnedManually] = useState(!!masterInfo?.lat)
  const { results: suggestions, loading: suggestLoading } = useAddressSuggest(addressQuery)

  // Пока пользователь не зафиксировал точку сам — показываем на карте
  // первый найденный вариант, чтобы адрес «появлялся» по мере ввода.
  useEffect(() => {
    if (!pinnedManually && suggestions.length > 0) {
      setAddressCoords({ lat: suggestions[0].lat, lng: suggestions[0].lng })
    }
  }, [suggestions, pinnedManually])

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
    if (serviceCreated || (!serviceName.trim() && !servicePrice && !serviceCategory)) {
      nextStep()
      return
    }

    if (!serviceName.trim() || !servicePrice || !serviceCategory) {
      toast.error('Заполните название, цену и категорию услуги или пропустите этот шаг')
      return
    }

    setLoading(true)
    const result = await addServiceAction({
      name: serviceName.trim(),
      category: serviceCategory,
      price_kzt: Number(servicePrice),
      duration_minutes: Number(serviceDuration),
    })
    setLoading(false)

    if (result.success) {
      setServiceCreated(true)
      nextStep()
    } else {
      toast.error(result.error)
    }
  }

  const handleStep3 = async () => {
    if (!addressQuery.trim()) {
      nextStep()
      return
    }

    setLoading(true)

    // Если координаты не выбраны из подсказок — геокодим напечатанный адрес сами.
    let coords = addressCoords
    let finalAddress = addressQuery
    if (!coords) {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(addressQuery)}`)
        const data = await res.json()
        const first = data.results?.[0]
        if (first) {
          coords = { lat: first.lat, lng: first.lng }
          finalAddress = first.value
          setAddressQuery(first.value)
          setAddressCoords(coords)
        }
      } catch {
        /* ниже покажем ошибку */
      }
    }

    if (!coords) {
      setLoading(false)
      toast.error('Не удалось найти адрес. Уточните улицу и номер дома.')
      return
    }

    const result = await saveOnboardingLocationAction({
      address: finalAddress,
      lat: coords.lat,
      lng: coords.lng,
    })
    setLoading(false)
    if (result.success) nextStep()
    else toast.error(result.error)
  }

  const handleSelectAddress = (suggestion: { value: string; lat: number; lng: number }) => {
    setAddressQuery(suggestion.value)
    setAddressCoords({ lat: suggestion.lat, lng: suggestion.lng })
    setPinnedManually(true)
    setShowSuggestions(false)
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
              <Button className="flex-1" onClick={handleStep2} disabled={loading}>
                {loading ? 'Сохранение...' : serviceName ? 'Сохранить и далее' : 'Пропустить'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ─── ШАГ 3: Адрес ───────────────────────────────────────── */}
        {step === 3 && (
          <Card className="p-6 space-y-5 shadow-sm">
            <div>
              <label className="text-sm font-medium block mb-2">Адрес приёма клиентов</label>
              <div className="relative">
                <Input
                  placeholder="ул. Кунаева, 12, офис 305, Астана"
                  value={addressQuery}
                  onChange={event => {
                    setAddressQuery(event.target.value)
                    setAddressCoords(null)
                    setPinnedManually(false)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pr-10"
                />
                {suggestLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.value}-${index}`}
                        type="button"
                        onClick={() => handleSelectAddress(suggestion)}
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF2D78]" />
                        <span>{suggestion.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Начните вводить адрес и выберите подсказку — или отметьте место на карте вручную.
              </p>
            </div>

            <LocationPicker
              value={addressCoords}
              onPick={(coords, address) => {
                setAddressCoords(coords)
                if (address) setAddressQuery(address)
                setPinnedManually(true)
                setShowSuggestions(false)
              }}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Назад
              </Button>
              <Button className="flex-1" onClick={handleStep3} disabled={loading}>
                {addressQuery ? 'Сохранить и завершить' : 'Пропустить'} <ArrowRight className="w-4 h-4 ml-1" />
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
