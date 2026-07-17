import { NextResponse } from 'next/server'

// Бесплатный геокодер OpenStreetMap (Nominatim). Без ключа, но с политикой:
// не больше ~1 запроса/сек и обязательный User-Agent. Для онбординга хватает.
const UA = 'BeautyKZ/1.0 (https://beauty-platform-gamma.vercel.app; diaskalm45@gmail.com)'

/** Прямой геокодинг: текст → координаты + нормализованный адрес. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  if (!q || q.length < 3) return NextResponse.json({ result: null })

  try {
    const nom = new URL('https://nominatim.openstreetmap.org/search')
    nom.searchParams.set('format', 'jsonv2')
    nom.searchParams.set('q', `Астана, ${q}`)
    nom.searchParams.set('countrycodes', 'kz')
    nom.searchParams.set('limit', '1')
    nom.searchParams.set('accept-language', 'ru')

    const res = await fetch(nom.toString(), { headers: { 'User-Agent': UA } })
    const data = await res.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first) return NextResponse.json({ result: null })

    return NextResponse.json({
      result: {
        value: first.display_name as string,
        lat: Number(first.lat),
        lng: Number(first.lon),
      },
    })
  } catch (error) {
    console.error('Geocode (nominatim) error:', error)
    return NextResponse.json({ result: null })
  }
}
