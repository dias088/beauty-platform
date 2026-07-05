'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Photo = {
  id: string
  url: string
  position: number
}

type Props = {
  photos: Photo[]
}

export function PortfolioGallery({ photos }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const sorted = [...photos].sort((a, b) => a.position - b.position)

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < sorted.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  return (
    <>
      {/* Сетка */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {sorted.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(idx)}
            className="relative overflow-hidden rounded-lg h-48 hover:opacity-75 transition-opacity"
          >
            <Image
              src={photo.url}
              alt="Portfolio"
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Лайтбокс */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-4 text-white hover:bg-white/10 p-2 rounded disabled:opacity-50"
            disabled={selectedIndex === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-2xl aspect-square">
            <Image
              src={sorted[selectedIndex].url}
              alt="Portfolio"
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={handleNext}
            className="absolute right-4 text-white hover:bg-white/10 p-2 rounded disabled:opacity-50"
            disabled={selectedIndex === sorted.length - 1}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedIndex + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  )
}
