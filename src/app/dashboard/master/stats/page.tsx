import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { StatsCharts } from './_components/stats-charts'
import { PeriodFilter } from './_components/period-filter'
import { subDays, startOfDay } from 'date-fns'
import { Lock, TrendingUp, CalendarCheck, Wallet, Star, Sparkles } from 'lucide-react'

type Props = {
  searchParams: Promise<{ period?: string }>
}

async function getMasterStats(masterId: string, period: string) {
  const supabase = await createClient()

  let fromDate: string | null = null
  if (period === '7d') fromDate = startOfDay(subDays(new Date(), 7)).toISOString()
  if (period === '30d') fromDate = startOfDay(subDays(new Date(), 30)).toISOString()

  let query = supabase
    .from('bookings')
    .select('status, price_kzt_snapshot, starts_at')
    .eq('master_id', masterId)

  if (fromDate) query = query.gte('starts_at', fromDate)

  const { data: bookings } = await query
  const { data: master } = await supabase
    .from('masters')
    .select('rating, reviews_count')
    .eq('id', masterId)
    .single()

  const all = bookings || []
  const completed = all.filter(b => b.status === 'completed')
  const totalRevenue = completed.reduce((s, b) => s + (b.price_kzt_snapshot || 0), 0)

  const byStatus = [
    { name: 'Ожидание',     value: all.filter(b => b.status === 'pending').length },
    { name: 'Подтверждено', value: all.filter(b => b.status === 'confirmed').length },
    { name: 'Завершено',    value: completed.length },
    { name: 'Отменено',     value: all.filter(b => b.status?.includes('cancelled')).length },
  ]

  const revenueByDay = completed.reduce<Record<string, number>>((acc, b) => {
    const day = b.starts_at.slice(0, 10)
    acc[day] = (acc[day] || 0) + (b.price_kzt_snapshot || 0)
    return acc
  }, {})

  const revenueChart = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => ({ date: date.slice(5), revenue }))

  return {
    totalBookings: all.length,
    completedBookings: completed.length,
    totalRevenue,
    avgRating: master?.rating || 0,
    reviewCount: master?.reviews_count || 0,
    byStatus,
    revenueChart,
  }
}

export default async function StatsPage({ searchParams }: Props) {
  const { period = 'all' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: master } = await supabase
    .from('masters')
    .select('id, boost_until')
    .eq('profile_id', user.id)
    .single()

  if (!master) redirect('/onboarding')

  // Статистика входит в Pro-тариф (тот же, что даёт TOP-позицию/буст, 7990₸/мес)
  const isPro = master.boost_until ? new Date(master.boost_until) > new Date() : false

  const stats = await getMasterStats(master.id, period)

  const kpis = [
    { label: 'Всего записей', value: String(stats.totalBookings), icon: CalendarCheck },
    { label: 'Завершено', value: String(stats.completedBookings), icon: TrendingUp, accent: true },
    { label: 'Доход', value: formatPrice(stats.totalRevenue), icon: Wallet },
    { label: 'Рейтинг', value: stats.avgRating.toFixed(1), sub: `${stats.reviewCount} отзывов`, icon: Star },
  ]

  const dashboard = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="surface rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">{kpi.label}</p>
                <Icon className={`h-4 w-4 ${kpi.accent ? 'text-[var(--violet)]' : 'text-[var(--text-3)]'}`} />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-white">{kpi.value}</p>
              {kpi.sub && <p className="mt-1 text-xs text-[var(--text-3)]">{kpi.sub}</p>}
            </div>
          )
        })}
      </div>

      <StatsCharts byStatus={stats.byStatus} revenueChart={stats.revenueChart} />
    </div>
  )

  return (
    <main className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Статистика</h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            {isPro ? 'Аналитика записей, дохода и рейтинга' : 'Доступна в Pro-тарифе'}
          </p>
        </div>
        {isPro && <PeriodFilter current={period} />}
      </div>

      {isPro ? (
        dashboard
      ) : (
        <div className="relative">
          {/* Размытое превью реальных данных */}
          <div className="pointer-events-none select-none blur-[7px] opacity-50">{dashboard}</div>

          {/* Пейвол-оверлей */}
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <div className="surface w-full max-w-md rounded-2xl p-8 text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,45,120,0.12)' }}
              >
                <Lock className="h-5 w-5 text-[var(--violet)]" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-white">Статистика — в Pro-тарифе</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--text-2)]">
                Аналитика записей, дохода по дням, статусов и рейтинга. Входит в Pro-тариф
                вместе с TOP-позицией в каталоге.
              </p>
              <div className="mt-4 flex items-baseline justify-center gap-1.5">
                <span className="text-3xl font-extrabold text-white">7 990 ₸</span>
                <span className="text-sm text-[var(--text-3)]">/ мес</span>
              </div>
              <Link
                href="/dashboard/master/boost"
                className="btn-primary-glow mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                Оформить Pro
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
