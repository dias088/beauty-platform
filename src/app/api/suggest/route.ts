import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')
  
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    const geocodeUrl = new URL('https://geocode-maps.yandex.ru/1.x/')
    geocodeUrl.searchParams.set('apikey', process.env.YANDEX_GEOCODER_KEY || '')
    geocodeUrl.searchParams.set('format', 'json')
    geocodeUrl.searchParams.set('geocode', `Астана, ${q}`)
    geocodeUrl.searchParams.set('results', '5')
    geocodeUrl.searchParams.set('lang', 'ru_RU')

    const res = await fetch(geocodeUrl.toString())
    const data = await res.json()

    const features = data.response?.GeoObjectCollection?.featureMember || []
    const results = features.map((f: any) => {
      const geo = f.GeoObject
      const [lng, lat] = geo.Point.pos.split(' ').map(Number)
      return {
        value: geo.metaDataProperty.GeocoderMetaData.text,
        displayName: geo.name,
        lat,
        lng,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Geocoder error:', error)
    return NextResponse.json({ results: [] })
  }
}
