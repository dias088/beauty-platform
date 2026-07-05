import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { StatsCharts } from './_components/stats-charts'
import { PeriodFilter } from './_components/period-filter'
import { subDays, startOfDay } from 'date-fns'

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
    { name: 'Ожидание',   value: all.filter(b => b.status === 'pending').length },
    { name: 'Подтверждено', value: all.filter(b => b.status === 'confirmed').length },
    { name: 'Завершено',  value: completed.length },
    { name: 'Отменено',   value: all.filter(b => b.status?.includes('cancelled')).length },
  ]

  // Выручка по дням (последние 14 дней для графика)
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
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) redirect('/onboarding')

  const stats = await getMasterStats(master.id, period)

  const kpis = [
    { label: 'Всего записей',  value: stats.totalBookings,  color: '' },
    { label: 'Завершено',      value: stats.completedBookings, color: 'text-green-600' },
    { label: 'Доход',          value: formatPrice(stats.totalRevenue), color: '' },
    { label: 'Рейтинг',        value: `⭐ ${stats.avgRating.toFixed(1)}`, color: '', sub: `${stats.reviewCount} отзывов` },
  ]

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Статистика</h1>
        <PeriodFilter current={period} />
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="p-5">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
          </Card>
        ))}
      </div>

      <StatsCharts byStatus={stats.byStatus} revenueChart={stats.revenueChart} />
    </main>
  )
}
