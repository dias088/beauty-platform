'use client'

import { useRef } from 'react'
import { Map, Placemark, useYMaps } from '@pbe/react-yandex-maps'

const ASTANA_CENTER = [51.1694, 71.4491]

type Coords = { lat: number; lng: number }

type Props = {
  value: Coords | null
  /** Вызывается при клике по карте или перетаскивании маркера. */
  onPick: (coords: Coords, address?: string) => void
}

/**
 * Карта с ручным маркером. Клик по карте или перетаскивание метки задаёт
 * координаты; параллельно обратным геокодингом (ymaps.geocode) подтягиваем
 * текстовый адрес. Должен рендериться внутри <YMaps> (MapsProvider).
 */
export function LocationPicker({ value, onPick }: Props) {
  const ymaps = useYMaps(['geocode'])
  const mapRef = useRef<any>(null)
  const pmRef = useRef<any>(null)

  const place = async (lat: number, lng: number) => {
    onPick({ lat, lng })
    if (!ymaps) return
    try {
      const res = await ymaps.geocode([lat, lng], { results: 1 })
      const obj = res.geoObjects.get(0)
      if (obj) onPick({ lat, lng }, obj.getAddressLine())
    } catch {
      /* координаты уже сохранены, адрес оставим как есть */
    }
  }

  return (
    <div>
      <div className="h-60 w-full overflow-hidden rounded-xl border">
        <Map
          state={{ center: value ? [value.lat, value.lng] : ASTANA_CENTER, zoom: value ? 16 : 12 }}
          width="100%"
          height="100%"
          instanceRef={(ref: any) => {
            if (!ref || mapRef.current === ref) return
            mapRef.current = ref
            ref.events.add('click', (e: any) => {
              const c = e.get('coords')
              place(c[0], c[1])
            })
          }}
        >
          {value && (
            <Placemark
              geometry={[value.lat, value.lng]}
              options={{ draggable: true, preset: 'islands#icon', iconColor: '#FF2D78' }}
              instanceRef={(ref: any) => {
                if (!ref || pmRef.current === ref) return
                pmRef.current = ref
                ref.events.add('dragend', () => {
                  const c = ref.geometry.getCoordinates()
                  place(c[0], c[1])
                })
              }}
            />
          )}
        </Map>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Кликните по карте или перетащите маркер, чтобы указать точное место
      </p>
    </div>
  )
}
