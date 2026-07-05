'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'beauty_favorites'

function getFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function setFavorites(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useFavorites() {
  const [favorites, setFavoritesState] = useState<string[]>([])

  useEffect(() => {
    setFavoritesState(getFavorites())
  }, [])

  const toggle = (masterId: string) => {
    const current = getFavorites()
    const next = current.includes(masterId)
      ? current.filter(id => id !== masterId)
      : [...current, masterId]
    setFavorites(next)
    setFavoritesState(next)
    return !current.includes(masterId)
  }

  return { favorites, toggle }
}

type Props = {
  masterId: string
  className?: string
}

export function FavoriteButton({ masterId, className = '' }: Props) {
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    setIsFav(getFavorites().includes(masterId))
  }, [masterId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !isFav
    setIsFav(next)
    const current = getFavorites()
    setFavorites(next ? [...current, masterId] : current.filter(id => id !== masterId))
    toast.success(next ? 'Добавлено в избранное' : 'Удалено из избранного')
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
      />
    </button>
  )
}
