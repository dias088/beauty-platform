'use client'

import { useEffect, useState } from 'react'
import { getMastersByIdsAction } from './actions'
import { MasterCard } from '@/components/shared/master-card'
import { MasterCardSkeleton } from '@/components/shared/master-card-skeleton'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import type { MasterListItem } from '@/lib/queries/masters'

const STORAGE_KEY = 'beauty_favorites'

export default function FavoritesPage() {
  const [masters, setMasters] = useState<MasterListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids: string[] = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
    })()

    if (ids.length === 0) {
      setLoading(false)
      return
    }

    getMastersByIdsAction(ids).then(result => {
      setMasters(result)
      setLoading(false)
    })
  }, [])

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          Избранные мастера
        </h1>
        <p className="text-muted-foreground mt-1">Мастера которых вы сохранили</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <MasterCardSkeleton key={i} />)}
        </div>
      ) : masters.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg mb-2">Нет избранных мастеров</p>
          <p className="text-sm mb-6">Нажмите ❤️ на карточке мастера чтобы сохранить</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Найти мастера
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {masters.map(m => <MasterCard key={m.id} master={m} />)}
        </div>
      )}
    </main>
  )
}
