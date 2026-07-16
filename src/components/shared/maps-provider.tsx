'use client'

import { YMaps } from '@pbe/react-yandex-maps'

/**
 * Провайдер Яндекс-карт. Грузит JS API один раз (singleton) и раздаёт
 * ymaps через useYMaps дочерним компонентам. Геокодинг делаем на клиенте
 * (ymaps.geocode) — это бесплатно в рамках JS API, платный HTTP-геокодер
 * не нужен.
 */
export function MapsProvider({ children }: { children: React.ReactNode }) {
  return (
    <YMaps
      query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY, lang: 'ru_RU' }}
      preload
    >
      {children}
    </YMaps>
  )
}
