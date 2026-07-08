import { getMasterProfile } from '@/lib/queries/master-profile'
import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PortfolioGallery } from './_components/portfolio-gallery'
import { ServicesList } from './_components/services-list'
import { ReviewsList } from './_components/reviews-list'
import { BookingButton } from './_components/booking-button'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, AtSign, ArrowLeft, Sparkles } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const master = await getMasterProfile(id)

  return {
    title: `${master.profiles.full_name} — мастер красоты в Астане | Beauty Platform`,
    description: master.bio?.slice(0, 160) || 'Профессиональный мастер красоты',
    openGraph: {
      title: master.profiles.full_name,
      description: master.bio?.slice(0, 160),
      images: master.portfolio_photos?.[0]?.url ? [master.portfolio_photos[0].url] : [],
      type: 'profile',
    },
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  nail: 'Ногти',
  lash: 'Ресницы',
  brow: 'Брови',
  hair: 'Волосы',
  makeup: 'Макияж',
  cosmetology: 'Косметология',
}

export default async function MasterProfilePage({ params }: Props) {
  const { id } = await params
  const master = await getMasterProfile(id)

  const minPrice = master.services && master.services.length > 0
    ? Math.min(...master.services.map((s: { price_kzt: number }) => s.price_kzt))
    : null

  const isBoosted = master.boost_until ? new Date(master.boost_until) > new Date() : false

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: master.profiles.full_name,
    image: master.portfolio_photos?.[0]?.url,
    description: master.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Астана',
      streetAddress: master.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: master.lat,
      longitude: master.lng,
    },
    ...(master.reviews_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: master.rating,
        reviewCount: master.reviews_count,
      },
    }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="relative h-80 md:h-96 overflow-hidden">
          {/* Background: first portfolio photo or gradient */}
          {master.portfolio_photos?.[0] ? (
            <>
              <Image
                src={master.portfolio_photos[0].url}
                alt={master.profiles.full_name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-500 to-pink-500" />
          )}

          {/* Back button */}
          <Link
            href="/"
            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-sm hover:bg-black/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Назад
          </Link>

          {/* Profile info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto max-w-5xl flex items-end gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {master.profiles.avatar_url ? (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-3 border-white shadow-2xl overflow-hidden">
                    <Image
                      src={master.profiles.avatar_url}
                      alt={master.profiles.full_name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-3 border-white shadow-2xl bg-primary/20 flex items-center justify-center text-3xl text-white font-bold">
                    {master.profiles.full_name[0]}
                  </div>
                )}
                {isBoosted && (
                  <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    TOP
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {master.profiles.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {master.reviews_count > 0 ? (
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white text-sm font-semibold">
                        {master.rating.toFixed(1)}
                      </span>
                      <span className="text-white/70 text-xs">({master.reviews_count})</span>
                    </div>
                  ) : (
                    <span className="text-white/70 text-sm bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                      Новый мастер
                    </span>
                  )}
                  {minPrice && (
                    <span className="text-white/90 text-sm bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                      от {minPrice.toLocaleString('ru')} ₸
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-10">

              {/* Category badges + address */}
              <div className="flex flex-wrap gap-2 items-center">
                {master.categories.map((cat: string) => (
                  <Badge key={cat} className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    {CATEGORY_LABELS[cat]}
                  </Badge>
                ))}
                {master.address && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground ml-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {master.address}
                  </span>
                )}
                {master.instagram_handle && (
                  <a
                    href={`https://instagram.com/${master.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    {master.instagram_handle}
                  </a>
                )}
              </div>

              {/* Bio */}
              {master.bio && (
                <section>
                  <h2 className="text-xl font-bold mb-3">Обо мне</h2>
                  <p className="text-muted-foreground leading-relaxed">{master.bio}</p>
                </section>
              )}

              {/* Portfolio */}
              {master.portfolio_photos && master.portfolio_photos.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Портфолио</h2>
                  <PortfolioGallery photos={master.portfolio_photos} />
                </section>
              )}

              {/* Services */}
              {master.services && master.services.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Услуги</h2>
                  <ServicesList services={master.services} />
                </section>
              )}

              {/* Reviews */}
              {master.reviews && master.reviews.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">
                    Отзывы
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({master.reviews_count})
                    </span>
                  </h2>
                  <ReviewsList reviews={master.reviews} />
                </section>
              )}
            </div>

            {/* Sticky booking sidebar (desktop) */}
            <div className="hidden md:block">
              <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-sm space-y-5">
                <div>
                  <p className="font-bold text-lg leading-tight">{master.profiles.full_name}</p>
                  {master.reviews_count > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.round(master.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">
                        {master.rating.toFixed(1)} · {master.reviews_count} отзывов
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Новый мастер</p>
                  )}
                </div>

                {minPrice && (
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Стоимость от</p>
                    <p className="text-2xl font-bold text-primary">{minPrice.toLocaleString('ru')} ₸</p>
                  </div>
                )}

                {master.services && master.services.length > 0 && (
                  <BookingButton
                    masterId={master.id}
                    masterName={master.profiles.full_name}
                    services={master.services ?? []}
                  />
                )}

                {master.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1 border-t">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <span>{master.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky booking button */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 p-4 bg-background/95 backdrop-blur border-t">
        <BookingButton
          masterId={master.id}
          masterName={master.profiles.full_name}
          services={master.services ?? []}
        />
      </div>
    </>
  )
}
