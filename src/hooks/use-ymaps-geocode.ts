'use client'

import { useEffect, useState } from 'react'
import { useYMaps } from '@pbe/react-yandex-maps'

export type GeoResult = { value: string; lat: number; lng: number }

/**
 * Клиентский геокодинг по введённому тексту (ymaps.geocode). Возвращает
 * лучший найденный вариант с координатами. Работает на бесплатном JS API —
 * платный HTTP-геокодер не требуется. Должен вызываться внутри <YMaps>.
 */
export function useYmapsGeocode(query: string, debounceMs = 600) {
  const ymaps = useYMaps(['geocode'])
  const [result, setResult] = useState<GeoResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ymaps || query.trim().length < 4) {
      setResult(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await ymaps.geocode(`Астана, ${query}`, { results: 1 })
        const obj = res.geoObjects.get(0)
        if (obj) {
          const [lat, lng] = obj.geometry.getCoordinates()
          setResult({ value: obj.getAddressLine(), lat, lng })
        } else {
          setResult(null)
        }
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [ymaps, query, debounceMs])

  return { result, loading }
}
