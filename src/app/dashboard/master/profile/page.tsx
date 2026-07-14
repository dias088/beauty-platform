'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAction, updateLocationAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { useAddressSuggest } from '@/hooks/use-address-suggest'
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressRef = useRef<HTMLDivElement>(null)

  const { results: suggestions, loading: suggestLoading } = useAddressSuggest(addressQuery)

  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: master } = await supabase
        .from('masters')
        .select('bio, instagram_handle, categories, address')
        .eq('profile_id', user.id)
        .single()

      if (master) {
        setBio(master.bio || '')
        setInstagram(master.instagram_handle || '')
        setSelectedCategories(master.categories || [])
        setSavedAddress(master.address || '')
        setAddressQuery(master.address || '')
      }
    }

    loadProfile()
  }, [])

  // Закрываем список при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const handleSelectAddress = async (suggestion: { value: string; lat: number; lng: number }) => {
    setAddressQuery(suggestion.value)
    setShowSuggestions(false)
    setLocationLoading(true)

    const result = await updateLocationAction(suggestion.value, suggestion.lat, suggestion.lng)
    setLocationLoading(false)

    if (result.success) {
      setSavedAddress(suggestion.value)
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Адрес приёма клиентов</h2>
        </div>

        {savedAddress && (
          <p className="text-sm text-muted-foreground mb-3">
            Текущий: <span className="font-medium text-foreground">{savedAddress}</span>
          </p>
        )}

        <div ref={addressRef} className="relative">
          <div className="relative">
            <Input
              placeholder="Начните вводить адрес в Астане..."
              value={addressQuery}
              onChange={e => {
                setAddressQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pr-10"
            />
            {(suggestLoading || locationLoading) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2"
                  onMouseDown={() => handleSelectAddress(s)}
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{s.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Выберите адрес из подсказок — он появится на карте для клиентов
        </p>
      </Card>
    </main>
  )
}
