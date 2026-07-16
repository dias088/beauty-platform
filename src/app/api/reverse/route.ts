import { NextResponse } from 'next/server'

/** Обратный геокодинг: координаты → текстовый адрес (для ручного маркера на карте). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ address: null })

  try {
    const key = process.env.YANDEX_GEOCODER_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || ''
    const geo = new URL('https://geocode-maps.yandex.ru/1.x/')
    geo.searchParams.set('apikey', key)
    geo.searchParams.set('format', 'json')
    geo.searchParams.set('geocode', `${lng},${lat}`) // Яндекс ждёт «долгота,широта»
    geo.searchParams.set('lang', 'ru_RU')
    geo.searchParams.set('results', '1')

    const res = await fetch(geo.toString())
    const data = await res.json()
    const feature = data.response?.GeoObjectCollection?.featureMember?.[0]
    const address = feature?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || null
    return NextResponse.json({ address })
  } catch (error) {
    console.error('Reverse geocode error:', error)
    return NextResponse.json({ address: null })
  }
}
