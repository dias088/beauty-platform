import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { StatsCharts } from './_components/stats-charts'
import { PeriodFilter } from './_components/period-filter'
import { subDays, startOfDay } from 'date-fns'
import { Lock, TrendingUp, TrendingDown, CalendarCheck, Wallet, Star, Sparkles, type LucideIcon } from 'lucide-react'

type Props = {
  searchParams: Promise<{ period?: string }>
}

type Booking = { status: string; price_kzt_snapshot: number | null; starts_at: string }

function windowStats(rows: Booking[]) {
  const completed = rows.filter(b => b.status === 'completed')
  return {
    total: rows.length,
    completed: completed.length,
    revenue: completed.reduce((s, b) => s + (b.price_kzt_snapshot || 0), 0),
  }
}

/** % изменения текущего периода к предыдущему. null — если сравнивать не с чем. */
function delta(cur: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0) return cur > 0 ? { pct: 100, up: true } : null
  const pct = Math.round(((cur - prev) / prev) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

async function getMasterStats(masterId: string, period: string) {
  const supabase = await createClient()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : null

  // Тянем данные с запасом на предыдущий период для трендов
  const fromDate = days ? startOfDay(subDays(new Date(), days * 2)).toISOString() : null

  let query = supabase
    .from('bookings')
    .select('status, price_kzt_snapshot, starts_at')
    .eq('master_id', masterId)
  if (fromDate) query = query.gte('starts_at', fromDate)

  const { data } = await query
  const rows = (data || []) as Booking[]

  const { data: master } = await supabase
    .from('masters')
    .select('rating, reviews_count')
    .eq('id', masterId)
    .single()

  let current = rows
  let prev: Booking[] = []
  if (days) {
    const cutCur = subDays(new Date(), days)
    const cutPrev = subDays(new Date(), days * 2)
    current = rows.filter(b => new Date(b.starts_at) >= cutCur)
    prev = rows.filter(b => new Date(b.starts_at) >= cutPrev && new Date(b.starts_at) < cutCur)
  }

  const cur = windowStats(current)
  const pre = windowStats(prev)

  const byStatus = [
    { name: 'Ожидание',     value: current.filter(b => b.status === 'pending').length },
    { name: 'Подтверждено', value: current.filter(b => b.status === 'confirmed').length },
    { name: 'Завершено',    value: cur.completed },
    { name: 'Отменено',     value: current.filter(b => b.status?.includes('cancelled')).length },
  ]

  const revenueByDay = current
    .filter(b => b.status === 'completed')
    .reduce<Record<string, number>>((acc, b) => {
      const day = b.starts_at.slice(0, 10)
      acc[day] = (acc[day] || 0) + (b.price_kzt_snapshot || 0)
      return acc
    }, {})

  const revenueChart = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, revenue]) => ({ date: date.slice(5), revenue }))

  return {
    totalBookings: cur.total,
    completedBookings: cur.completed,
    totalRevenue: cur.revenue,
    avgRating: master?.rating || 0,
    reviewCount: master?.reviews_count || 0,
    trends: days
      ? {
          total: delta(cur.total, pre.total),
          completed: delta(cur.completed, pre.completed),
          revenue: delta(cur.revenue, pre.revenue),
        }
      : { total: null, completed: null, revenue: null },
    byStatus,
    revenueChart,
  }
}

type Kpi = {
  label: string
  value: string
  icon: LucideIcon
  trend: { pct: number; up: boolean } | null
  note: string
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  const TrendIcon = kpi.trend?.up ? TrendingUp : TrendingDown
  const trendColor = kpi.trend?.up ? 'text-[#34d399]' : 'text-[#f87171]'
  return (
    <div className="surface flex flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">{kpi.label}</p>
        {kpi.trend && (
          <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {kpi.trend.up ? '+' : '−'}{kpi.trend.pct}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[1.7rem] font-semibold tabular-nums leading-none tracking-tight text-white">{kpi.value}</p>
      <div className="mt-auto pt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
          <Icon className="h-3.5 w-3.5 text-[var(--violet)]" />
          {kpi.note}
        </p>
      </div>
    </div>
  )
}

export default async function StatsPage({ searchParams }: Props) {
  // По умолчанию — 30 дней (чтобы тренды считались сразу)
  const { period = '30d' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: master } = await supabase
    .from('masters')
    .select('id, boost_until')
    .eq('profile_id', user.id)
    .single()

  if (!master) redirect('/onboarding')

  const isPro = master.boost_until ? new Date(master.boost_until) > new Date() : false
  const stats = await getMasterStats(master.id, period)

  const kpis: Kpi[] = [
    { label: 'Всего записей', value: String(stats.totalBookings), icon: CalendarCheck, trend: stats.trends.total, note: 'За выбранный период' },
    { label: 'Завершено', value: String(stats.completedBookings), icon: TrendingUp, trend: stats.trends.completed, note: 'Проведённые приёмы' },
    { label: 'Доход', value: formatPrice(stats.totalRevenue), icon: Wallet, trend: stats.trends.revenue, note: 'С завершённых записей' },
    { label: 'Рейтинг', value: stats.avgRating.toFixed(1), icon: Star, trend: null, note: `${stats.reviewCount} отзывов` },
  ]

  const dashboard = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} kpi={kpi} />)}
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
          <div className="pointer-events-none select-none blur-[7px] opacity-50">{dashboard}</div>
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <div className="surface w-full max-w-md rounded-2xl p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(255,45,120,0.12)' }}>
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
