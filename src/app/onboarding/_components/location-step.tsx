'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { saveLocationAction } from '../actions'
import { useAddressSuggest } from '@/hooks/use-address-suggest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const YandexMap = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.Map), {
  loading: () => <div className="w-full h-80 bg-muted animate-pulse rounded-lg" />,
  ssr: false,
})

const Placemark = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.Placemark), {
  ssr: false,
})

const YMaps = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.YMaps), {
  ssr: false,
})

type LocationState = {
  address: string
  lat: number | null
  lng: number | null
}

export function LocationStep({ initialData }: { initialData?: any }) {
  const { pending } = useFormStatus()
  const [location, setLocation] = useState<LocationState>({
    address: initialData?.address || '',
    lat: initialData?.lat || null,
    lng: initialData?.lng || null
  })
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { results: suggestions, loading: suggestLoading } = useAddressSuggest(query)
  const mapRef = useRef<any>(null)
  const placemarkRef = useRef<any>(null)

  const handleSelectSuggestion = (suggestion: any) => {
    setLocation({
      address: suggestion.value,
      lat: suggestion.lat,
      lng: suggestion.lng,
    })
    setQuery('')
    setShowSuggestions(false)
  }

  const handlePlacemarkDragEnd = (e: any) => {
    const coords = e.get('target').geometry.getCoordinates()
    setLocation(prev => ({
      ...prev,
      lat: coords[0],
      lng: coords[1],
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Адрес</Label>
            <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
              <PopoverTrigger
                nativeButton={false}
                render={
                  <Input
                    id="address"
                    placeholder="Введите адрес..."
                    value={query || location.address}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    disabled={pending}
                  />
                }
              />
              {showSuggestions && (
                <PopoverContent className="w-full p-0" align="start">
                  {suggestLoading && <div className="p-2 text-sm text-muted-foreground">Загрузка...</div>}
                  {suggestions.length === 0 && !suggestLoading && query && (
                    <div className="p-2 text-sm text-muted-foreground">Ничего не найдено</div>
                  )}
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      {s.value}
                    </button>
                  ))}
                </PopoverContent>
              )}
            </Popover>
          </div>

          {location.lat && location.lng && (
            <div className="rounded-lg overflow-hidden border h-80">
              <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY, lang: 'ru_RU' }}>
                <YandexMap
                  ref={mapRef}
                  defaultState={{ center: [location.lat, location.lng], zoom: 15 }}
                  width="100%"
                  height="100%"
                >
                  <Placemark
                    ref={placemarkRef}
                    defaultGeometry={[location.lat, location.lng]}
                    properties={{ balloonContent: 'Ваше местоположение' }}
                    options={{
                      draggable: true,
                      preset: 'islands#icon',
                      iconColor: '#FF2D78',
                    }}
                    onDragEnd={handlePlacemarkDragEnd}
                  />
                </YandexMap>
              </YMaps>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between gap-4">
        <Button variant="outline" disabled={pending}>
          Назад
        </Button>
        <Button
          onClick={() => {
            if (!location.address || location.lat === null || location.lng === null) {
              toast.error('Выберите адрес на карте')
              return
            }
            saveLocationAction(location as any)
          }}
          disabled={pending || !location.address || location.lat === null || location.lng === null}
        >
          {pending ? 'Сохранение...' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}
