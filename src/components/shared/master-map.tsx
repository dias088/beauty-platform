'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { MasterListItem } from '@/lib/queries/masters'

const YMaps = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.YMaps), { ssr: false })
const Map = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.Map), { ssr: false })
const ObjectManager = dynamic(() => import('@pbe/react-yandex-maps').then(m => m.ObjectManager), { ssr: false })

type Props = {
  masters: MasterListItem[]
  selectedId?: string
  onSelect: (masterId: string) => void
}

const ASTANA_CENTER = [51.1694, 71.4491]

export function MasterMap({ masters, selectedId, onSelect }: Props) {
  const features = useMemo(() =>
    masters
      .filter(m => m.lat && m.lng)
      .map(m => ({
        type: 'Feature' as const,
        id: m.id,
        geometry: { type: 'Point', coordinates: [m.lat, m.lng] },
        properties: {
          balloonContent: `
            <div style="padding:8px;max-width:200px;font-family:sans-serif;">
              <strong>${m.full_name}</strong>
              <div style="font-size:12px;color:#666;margin-top:4px;">⭐ ${m.rating.toFixed(1)} (${m.reviews_count})</div>
              ${m.min_price ? `<div style="font-size:12px;color:#666;">от ${m.min_price.toLocaleString('ru')} ₸</div>` : ''}
              <a href="/masters/${m.id}" style="color:#0066ff;font-size:12px;display:block;margin-top:8px;">Открыть профиль</a>
            </div>
          `,
          hintContent: m.full_name,
        },
        options: {
          preset: m.id === selectedId ? 'islands#redIcon' : 'islands#pinkIcon',
        },
      })),
    [masters, selectedId]
  )

  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY, lang: 'ru_RU', load: 'package.full' }}>
      <Map
        defaultState={{ center: ASTANA_CENTER as any, zoom: 12 }}
        width="100%"
        height="100%"
        modules={['ObjectManager', 'Clusterer']}
      >
        <ObjectManager
          options={{ clusterize: true, gridSize: 64 }}
          objects={{ openBalloonOnClick: true, preset: 'islands#pinkIcon' }}
          clusters={{ preset: 'islands#pinkClusterIcons' }}
          features={features as any}
          instanceRef={(ref: any) => {
            if (!ref) return
            ref.objects.events.add('click', (e: any) => {
              const id = e.get('objectId')
              onSelect(id)
            })
          }}
        />
      </Map>
    </YMaps>
  )
}
