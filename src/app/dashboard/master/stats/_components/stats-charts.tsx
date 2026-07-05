'use client'

import { Card } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts'

type Props = {
  byStatus: { name: string; value: number }[]
  revenueChart: { date: string; revenue: number }[]
}

export function StatsCharts({ byStatus, revenueChart }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Записи по статусам</h2>
        {byStatus.every(b => b.value === 0) ? (
          <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatus} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Выручка по дням</h2>
        {revenueChart.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
            Нет завершённых записей за период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString('ru')} ₸`, 'Выручка']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
