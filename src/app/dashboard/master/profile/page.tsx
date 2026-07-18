'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAction, updateLocationAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { useGeocode } from '@/hooks/use-geocode'
import { LocationPicker } from '@/components/shared/location-picker'
import { MapsProvider } from '@/components/shared/maps-provider'
import { MapPin, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'nail', label: 'Ногти' },
  { value: 'lash', label: 'Ресницы' },
  { value: 'brow', label: 'Брови' },
  { value: 'hair', label: 'Волосы' },
  { value: 'makeup', label: 'Макияж' },
  { value: 'cosmetology', label: 'Косметология' },
]

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Локация
  const [addressQuery, setAddressQuery] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null)
  // true — точка выбрана вручную (карта) или загружена сохранённой, тогда
  // живой предпросмотр по вводу не перебивает её.
  const [pinnedManually, setPinnedManually] = useState(true)

  const { result: geoResult, loading: geoLoading } = useGeocode(addressQuery)

  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: master } = await supabase
        .from('masters')
        .select('bio, instagram_handle, categories, address, lat, lng')
        .eq('profile_id', user.id)
        .single()

      if (master) {
        setBio(master.bio || '')
        setInstagram(master.instagram_handle || '')
        setSelectedCategories(master.categories || [])
        setSavedAddress(master.address || '')
        setAddressQuery(master.address || '')
        if (typeof master.lat === 'number' && typeof master.lng === 'number') {
          setAddressCoords({ lat: master.lat, lng: master.lng })
          setPinnedManually(true)
        }
      }
    }

    loadProfile()
  }, [])

  // Живой предпросмотр найденного адреса на карте (пока не зафиксировали вручную).
  useEffect(() => {
    if (!pinnedManually && geoResult) {
      setAddressCoords({ lat: geoResult.lat, lng: geoResult.lng })
    }
  }, [geoResult, pinnedManually])

  const handleSave = async () => {
    if (!bio.trim() || selectedCategories.length === 0) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    const result = await updateProfileAction(bio, selectedCategories, instagram || undefined)
    setLoading(false)

    if (result.success) {
      toast.success('Профиль обновлён')
    } else {
      toast.error(result.error)
    }
  }

  const handleSaveAddress = async () => {
    const coords = addressCoords ?? (geoResult ? { lat: geoResult.lat, lng: geoResult.lng } : null)
    if (!coords) {
      toast.error('Адрес не найден. Отметьте место на карте вручную.')
      return
    }

    const address = !pinnedManually && geoResult ? geoResult.value : addressQuery
    setLocationLoading(true)
    const result = await updateLocationAction(address, coords.lat, coords.lng)
    setLocationLoading(false)

    if (result.success) {
      setSavedAddress(address)
      setAddressQuery(address)
      toast.success('Адрес обновлён')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Профиль</h1>

      {/* Основная информация */}
      <Card className="p-6 space-y-6 mb-6">
        <div>
          <label className="text-sm font-medium">О вас</label>
          <Textarea
            placeholder="Напишите о себе, опыте, специализации..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="mt-2"
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {bio.length} символов (минимум 20)
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Instagram</label>
          <Input
            placeholder="@username"
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-3">Специализация</label>
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedCategories.includes(cat.value)}
                  onCheckedChange={checked => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, cat.value])
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat.value))
                    }
                  }}
                />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </Card>

      {/* Локация */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Адрес приёма клиентов</h2>
        </div>

        {savedAddress && (
          <p className="text-sm text-muted-foreground">
            Текущий: <span className="font-medium text-foreground">{savedAddress}</span>
          </p>
        )}

        <div>
          <div className="relative">
            <Input
              placeholder="Начните вводить адрес в Астане..."
              value={addressQuery}
              onChange={e => {
                setAddressQuery(e.target.value)
                setAddressCoords(null)
                setPinnedManually(false)
              }}
              className="pr-10"
            />
            {(geoLoading || locationLoading) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {!pinnedManually && geoResult && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-green-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Найдено: {geoResult.value}
            </p>
          )}
        </div>

        <MapsProvider>
          <LocationPicker
            value={addressCoords}
            onPick={(coords, address) => {
              setAddressCoords(coords)
              if (address) setAddressQuery(address)
              setPinnedManually(true)
            }}
          />
        </MapsProvider>

        <Button onClick={handleSaveAddress} disabled={locationLoading} className="w-full">
          {locationLoading ? 'Сохранение...' : 'Сохранить адрес'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Введите адрес — он появится на карте. Если точка встала неточно, поправьте маркер вручную.
        </p>
      </Card>
    </main>
  )
}
