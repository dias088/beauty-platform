'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const CATEGORIES = [
  { value: 'nail', label: 'Маникюр' },
  { value: 'lash', label: 'Ресницы' },
  { value: 'brow', label: 'Брови' },
  { value: 'hair', label: 'Волосы' },
  { value: 'makeup', label: 'Макияж' },
  { value: 'cosmetology', label: 'Косметология' },
]

const SORT_OPTIONS = [
  { value: 'rating',    label: 'По рейтингу' },
  { value: 'reviews',   label: 'По отзывам' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
]

export function FiltersBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const query = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'rating'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const [showPriceFilter, setShowPriceFilter] = useState(!!(minPrice || maxPrice))
  const [minVal, setMinVal] = useState(minPrice)
  const [maxVal, setMaxVal] = useState(maxPrice)

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.replace(`/?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    update('q', e.target.value || null)
  }

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams)
    if (minVal) params.set('minPrice', minVal)
    else params.delete('minPrice')
    if (maxVal) params.set('maxPrice', maxVal)
    else params.delete('maxPrice')
    router.replace(`/?${params.toString()}`)
  }

  const handleReset = () => {
    setMinVal('')
    setMaxVal('')
    router.replace('/')
  }

  const hasFilters = category || query || (sort && sort !== 'rating') || minPrice || maxPrice

  return (
    <div className="sticky top-0 z-30 shrink-0 border-b border-white/[0.06] bg-[#0d0d0f]/85 backdrop-blur">
      {/* Top row: search + sort */}
      <div className="container mx-auto px-4 py-3 flex gap-2 items-center">
        <Input
          placeholder="Поиск мастера, услуги или адреса..."
          value={query}
          onChange={handleSearch}
          className="flex-1 h-9"
        />

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={e => update('sort', e.target.value === 'rating' ? null : e.target.value)}
            className="h-9 appearance-none border border-input bg-background rounded-md px-3 pr-8 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Price filter toggle */}
        <button
          onClick={() => setShowPriceFilter(v => !v)}
          className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-sm transition-colors shrink-0 ${
            (minPrice || maxPrice)
              ? 'border-[var(--violet)]/50 text-[var(--violet-bright)] bg-[rgba(167,139,250,0.08)]'
              : 'border-white/10 text-[var(--text-2)] hover:bg-white/[0.04] hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Цена</span>
        </button>

        {hasFilters && (
          <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0 h-9">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Price filter row */}
      {showPriceFilter && (
        <div className="container mx-auto px-4 pb-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">Цена от</span>
          <Input
            type="number"
            placeholder="0"
            value={minVal}
            onChange={e => setMinVal(e.target.value)}
            className="w-28 h-8 text-sm"
          />
          <span className="text-sm text-muted-foreground shrink-0">до</span>
          <Input
            type="number"
            placeholder="100 000"
            value={maxVal}
            onChange={e => setMaxVal(e.target.value)}
            className="w-28 h-8 text-sm"
          />
          <span className="text-sm text-muted-foreground shrink-0">₸</span>
          <Button size="sm" onClick={handlePriceApply} className="h-8">
            Применить
          </Button>
        </div>
      )}

      {/* Category pills */}
      <div className="container mx-auto px-4 pb-3 flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => update('category', category === cat.value ? null : cat.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              category === cat.value
                ? 'text-white shadow-[var(--glow-violet)]'
                : 'border border-white/10 bg-white/[0.04] text-[var(--text-2)] hover:border-[var(--violet)]/40 hover:text-white'
            }`}
            style={
              category === cat.value ? { background: 'var(--gradient-primary)' } : undefined
            }
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
