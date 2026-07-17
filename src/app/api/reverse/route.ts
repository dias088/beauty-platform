import { NextResponse } from 'next/server'

// Обратный геокодинг через бесплатный Nominatim (координаты → адрес).
const UA = 'BeautyKZ/1.0 (https://beauty-platform-gamma.vercel.app; diaskalm45@gmail.com)'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ address: null })

  try {
    const nom = new URL('https://nominatim.openstreetmap.org/reverse')
    nom.searchParams.set('format', 'jsonv2')
    nom.searchParams.set('lat', lat)
    nom.searchParams.set('lon', lng)
    nom.searchParams.set('accept-language', 'ru')

    const res = await fetch(nom.toString(), { headers: { 'User-Agent': UA } })
    const data = await res.json()
    return NextResponse.json({ address: data?.display_name || null })
  } catch (error) {
    console.error('Reverse (nominatim) error:', error)
    return NextResponse.json({ address: null })
  }
}
