'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'

type Props = {
  byStatus: { name: string; value: number }[]
  revenueChart: { date: string; revenue: number }[]
}

// Тёмная тема графиков (розово-чёрная)
const PINK = '#FF2D78'
const PINK_LT = '#FF5C97'
const GRID = 'rgba(255,255,255,0.06)'
const AXIS = '#8b919d'
const TOOLTIP_STYLE = {
  background: '#17171c',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 13,
}

export function StatsCharts({ byStatus, revenueChart }: Props) {
  return (
    <div className="space-y-6">
      {/* Большой график выручки — как «Total Visitors» */}
      <div className="surface rounded-2xl p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Выручка по дням</h2>
        </div>
        <p className="mb-5 text-sm text-[var(--text-3)]">Завершённые записи за выбранный период</p>

        {revenueChart.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-[var(--text-3)]">
            Нет завершённых записей за период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChart} margin={{ left: 4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PINK} stopOpacity={0.5} />
                  <stop offset="60%" stopColor={PINK} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={PINK} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={44} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,45,120,0.35)' }} formatter={(v) => [`${Number(v).toLocaleString('ru')} ₸`, 'Выручка']} />
              <Area type="monotone" dataKey="revenue" stroke={PINK_LT} strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Записи по статусам */}
      <div className="surface rounded-2xl p-6">
        <h2 className="mb-1 text-base font-semibold text-white">Записи по статусам</h2>
        <p className="mb-5 text-sm text-[var(--text-3)]">Распределение за выбранный период</p>

        {byStatus.every(b => b.value === 0) ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-3)]">
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} barSize={44} margin={{ left: 4, right: 8 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PINK} stopOpacity={1} />
                  <stop offset="100%" stopColor={PINK} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,45,120,0.08)' }} />
              <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
