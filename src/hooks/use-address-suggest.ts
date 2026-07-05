'use client'

import { useEffect, useState } from 'react'

type Suggestion = { value: string; displayName: string; lat: number; lng: number }

export function useAddressSuggest(query: string, debounceMs = 600) {
  const [results, setResults] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Suggest error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [query, debounceMs])

  return { results, loading }
}
