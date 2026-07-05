import { getMasters } from '@/lib/queries/masters'
import { createClient } from '@/lib/supabase/server'
import { MasterListMap } from './_components/master-list-map'
import { HeroSection } from './_components/hero-section'
import { HowItWorks } from './_components/how-it-works'
import { CategorySections } from './_components/category-sections'
import { FiltersBar } from './_components/filters-bar'
import { Suspense } from 'react'


export const dynamic = 'force-dynamic'

export default async function Home(props: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; minPrice?: string; maxPrice?: string }>
}) {
  const searchParams = await props.searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const masters = await getMasters({
    category: searchParams.category,
    search: searchParams.q,
    sort: searchParams.sort as any,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
  })

  const hasFilters = !!(searchParams.category || searchParams.q || searchParams.sort || searchParams.minPrice || searchParams.maxPrice)

  // Filtered view: grid + map with sidebar filters
  if (hasFilters) {
    return (
      <main className="min-h-screen flex flex-col">
        <Suspense>
          <MasterListMap initialMasters={masters} isAuthenticated={!!user} />
        </Suspense>
      </main>
    )
  }

  // Homepage: category sections
  return (
    <main className="min-h-screen flex flex-col">
      {!user && <HeroSection />}

      <Suspense>
        <FiltersBar />
      </Suspense>

      <CategorySections masters={masters} />

      {!user && <HowItWorks />}
    </main>
  )
}
