'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'

const YMaps = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.YMaps), { ssr: false })
const Map = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.Map), { ssr: false })
const Placemark = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.Placemark), { ssr: false })

const ASTANA_CENTER = [51.1694, 71.4491]

type Coords = { lat: number; lng: number }

type Props = {
  value: Coords | null
  /** Вызывается при клике по карте или перетаскивании маркера. */
  onPick: (coords: Coords, address?: string) => void
}

/**
 * Карта с ручным маркером. Клик по карте или перетаскивание метки задаёт
 * координаты; параллельно обратным геокодингом подтягиваем текстовый адрес.
 */
export function LocationPicker({ value, onPick }: Props) {
  const mapRef = useRef<any>(null)
  const pmRef = useRef<any>(null)

  const place = async (lat: number, lng: number) => {
    onPick({ lat, lng })
    try {
      const res = await fetch(`/api/reverse?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (data.address) onPick({ lat, lng }, data.address)
    } catch {
      /* адрес оставим как есть — координаты уже сохранены */
    }
  }

  return (
    <div>
      <div className="h-60 w-full overflow-hidden rounded-xl border">
        <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY, lang: 'ru_RU' }}>
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
        </YMaps>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Кликните по карте или перетащите маркер, чтобы указать точное место
      </p>
    </div>
  )
}
