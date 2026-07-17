'use client'

import { useEffect, useState } from 'react'

export type GeoResult = { value: string; lat: number; lng: number }

/**
 * Прямой геокодинг введённого адреса через наш серверный endpoint
 * (бесплатный Nominatim). Возвращает лучший найденный вариант с координатами.
 */
export function useGeocode(query: string, debounceMs = 800) {
  const [result, setResult] = useState<GeoResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < 4) {
      setResult(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResult(data.result ?? null)
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [query, debounceMs])

  return { result, loading }
}
