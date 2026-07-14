import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { StatsCharts } from './_components/stats-charts'
import { PeriodFilter } from './_components/period-filter'
import { subDays, startOfDay, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
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

function delta(cur: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0) return cur > 0 ? { pct: 100, up: true } : null
  const pct = Math.round(((cur - prev) / prev) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

async function getMasterStats(masterId: string, period: string) {
  const supabase = await createClient()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : null
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
      ? { total: delta(cur.total, pre.total), completed: delta(cur.completed, pre.completed), revenue: delta(cur.revenue, pre.revenue) }
      : { total: null, completed: null, revenue: null },
    byStatus,
    revenueChart,
  }
}

type RecentRow = {
  id: string
  service: string
  status: string
  starts_at: string
  price: number
  client: string
}

async function getRecentBookings(masterId: string): Promise<RecentRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('id, status, starts_at, service_name_snapshot, price_kzt_snapshot, profiles!bookings_client_id_fkey (full_name)')
    .eq('master_id', masterId)
    .order('starts_at', { ascending: false })
    .limit(8)

  return (data || []).map((b: any) => ({
    id: b.id,
    service: b.service_name_snapshot ?? 'Услуга',
    status: b.status,
    starts_at: b.starts_at,
    price: b.price_kzt_snapshot ?? 0,
    client: b.profiles?.full_name ?? 'Клиент',
  }))
}

const STATUS_TONE: Record<string, { label: string; cls: string; dot: string }> = {
  completed:           { label: 'Завершена',   cls: 'text-[#34d399]', dot: 'bg-[#34d399]' },
  confirmed:           { label: 'Подтверждена', cls: 'text-[#93c5fd]', dot: 'bg-[#93c5fd]' },
  pending:             { label: 'Ожидает',     cls: 'text-[#fbbf24]', dot: 'bg-[#fbbf24]' },
  cancelled_by_client: { label: 'Отменена',    cls: 'text-[#f87171]', dot: 'bg-[#f87171]' },
  cancelled_by_master: { label: 'Отменена',    cls: 'text-[#f87171]', dot: 'bg-[#f87171]' },
  no_show:             { label: 'Не пришёл',   cls: 'text-[#f87171]', dot: 'bg-[#f87171]' },
}

type Kpi = {
  label: string
  value: string
  icon: LucideIcon
  trend: { pct: number; up: boolean } | null
  note: string
  sub: string
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
      <p className="mt-3 text-[1.75rem] font-semibold tabular-nums leading-none tracking-tight text-white">{kpi.value}</p>
      <div className="mt-auto pt-5 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-white">
          <Icon className="h-3.5 w-3.5 text-[var(--violet)]" />
          {kpi.note}
        </p>
        <p className="mt-0.5 text-[var(--text-3)]">{kpi.sub}</p>
      </div>
    </div>
  )
}

export default async function StatsPage({ searchParams }: Props) {
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
  const recent = await getRecentBookings(master.id)

  const kpis: Kpi[] = [
    {
      label: 'Всего записей', value: String(stats.totalBookings), icon: CalendarCheck, trend: stats.trends.total,
      note: stats.trends.total ? (stats.trends.total.up ? 'Рост за период' : 'Снижение за период') : 'За выбранный период',
      sub: 'Все записи в этом окне',
    },
    {
      label: 'Завершено', value: String(stats.completedBookings), icon: TrendingUp, trend: stats.trends.completed,
      note: stats.trends.completed ? (stats.trends.completed.up ? 'Больше приёмов' : 'Меньше приёмов') : 'Проведённые приёмы',
      sub: 'Отмеченные как «завершена»',
    },
    {
      label: 'Доход', value: formatPrice(stats.totalRevenue), icon: Wallet, trend: stats.trends.revenue,
      note: stats.trends.revenue ? (stats.trends.revenue.up ? 'Выручка растёт' : 'Выручка ниже') : 'С завершённых записей',
      sub: 'За выбранный период',
    },
    {
      label: 'Рейтинг', value: stats.avgRating.toFixed(1), icon: Star, trend: null,
      note: 'Средняя оценка', sub: `${stats.reviewCount} отзывов`,
    },
  ]

  const dashboard = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} kpi={kpi} />)}
      </div>

      <StatsCharts byStatus={stats.byStatus} revenueChart={stats.revenueChart} />

      {/* Таблица последних записей */}
      <div className="surface overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-base font-semibold text-white">Последние записи</h2>
          <Link href="/dashboard/master" className="text-sm text-[var(--violet-bright)] hover:underline">Все записи</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-white/[0.06] text-left text-[var(--text-3)]">
                <th className="px-6 py-2.5 font-medium">Услуга</th>
                <th className="px-6 py-2.5 font-medium">Клиент</th>
                <th className="px-6 py-2.5 font-medium">Статус</th>
                <th className="px-6 py-2.5 font-medium">Дата</th>
                <th className="px-6 py-2.5 text-right font-medium">Цена</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-3)]">Записей пока нет</td></tr>
              ) : recent.map(r => {
                const st = STATUS_TONE[r.status] ?? { label: r.status, cls: 'text-[var(--text-2)]', dot: 'bg-white/30' }
                return (
                  <tr key={r.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-3 font-medium text-white">{r.service}</td>
                    <td className="px-6 py-3 text-[var(--text-2)]">{r.client}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 ${st.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[var(--text-3)]">{format(parseISO(r.starts_at), 'd MMM, HH:mm', { locale: ru })}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-white">{formatPrice(r.price)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
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
