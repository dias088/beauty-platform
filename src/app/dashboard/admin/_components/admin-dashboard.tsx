'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Users, Star, TrendingUp, CheckCircle2, Clock,
  Search, Shield, ShieldOff, Zap, Eye, BarChart3
} from 'lucide-react'
import { verifyMasterAction, deactivateMasterAction, activateBoostAdminAction } from '../actions'

type Stats = {
  totalMasters: number
  verifiedMasters: number
  pendingMasters: number
  totalBookings30d: number
  completedBookings: number
  revenue30d: number
  totalClients: number
}

type Master = {
  id: string
  is_verified: boolean
  is_active: boolean
  rating: number
  reviews_count: number
  completed_bookings: number
  created_at: string
  boost_until: string | null
  categories: string[]
  profiles: { full_name: string; avatar_url: string | null }
}

type Props = {
  stats: Stats
  masters: Master[]
  recentProfiles: any[]
}

const STAT_CARDS = (s: Stats) => [
  { label: 'Всего мастеров',    value: s.totalMasters,      icon: Users,       color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Верифицировано',    value: s.verifiedMasters,   icon: CheckCircle2,color: 'text-green-600',  bg: 'bg-green-50'  },
  { label: 'Ожидают проверки',  value: s.pendingMasters,    icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50', alert: s.pendingMasters > 0 },
  { label: 'Записей (30 дн)',   value: s.totalBookings30d,  icon: BarChart3,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { label: 'Завершено',         value: s.completedBookings, icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50'  },
  { label: 'Выручка (30 дн)',   value: `${(s.revenue30d/1000).toFixed(0)}K ₸`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Клиентов',          value: s.totalClients,      icon: Users,       color: 'text-violet-600', bg: 'bg-violet-50' },
]

type Tab = 'masters' | 'pending'

export function AdminDashboard({ stats, masters, recentProfiles }: Props) {
  const [tab, setTab]         = useState<Tab>('pending')
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const pending  = masters.filter(m => !m.is_verified && m.is_active)
  const verified = masters.filter(m => m.is_verified)

  const displayList = (tab === 'pending' ? pending : masters)
    .filter(m => m.profiles.full_name.toLowerCase().includes(search.toLowerCase()))

  const handleVerify = async (masterId: string) => {
    setLoading(masterId)
    const result = await verifyMasterAction(masterId)
    setLoading(null)
    if (result.success) toast.success('Мастер верифицирован')
    else toast.error(result.error)
  }

  const handleDeactivate = async (masterId: string) => {
    setLoading(masterId)
    const result = await deactivateMasterAction(masterId)
    setLoading(null)
    if (result.success) toast.success('Мастер деактивирован')
    else toast.error(result.error)
  }

  const handleBoost = async (masterId: string) => {
    setLoading(masterId)
    const result = await activateBoostAdminAction(masterId, '7d')
    setLoading(null)
    if (result.success) toast.success('Буст активирован на 7 дней')
    else toast.error(result.error)
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAT_CARDS(stats).map(card => (
          <Card key={card.label} className={`p-4 ${card.alert ? 'border-amber-300 bg-amber-50/50' : ''}`}>
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Masters management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {([['pending', `Ожидают (${pending.length})`], ['masters', `Все мастера (${masters.length})`]] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск мастера..." className="pl-9 h-8 text-sm"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {displayList.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium">{tab === 'pending' ? 'Все мастера проверены!' : 'Мастеров нет'}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayList.map(master => {
              const isBoosted = master.boost_until && new Date(master.boost_until) > new Date()
              return (
                <Card key={master.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={master.profiles.avatar_url ?? undefined} />
                      <AvatarFallback>{master.profiles.full_name[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{master.profiles.full_name}</span>
                        {master.is_verified
                          ? <Badge className="bg-green-100 text-green-800 border-0 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> Верифицирован</Badge>
                          : <Badge className="bg-amber-100 text-amber-800 border-0 text-xs gap-1"><Clock className="w-3 h-3" /> Ожидает</Badge>
                        }
                        {isBoosted && <Badge className="bg-amber-100 text-amber-800 border-0 text-xs gap-1"><Zap className="w-3 h-3" /> Буст</Badge>}
                        {!master.is_active && <Badge variant="destructive" className="text-xs">Деактивирован</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {master.rating.toFixed(1)} ({master.reviews_count})</span>
                        <span>·</span>
                        <span>{master.completed_bookings} записей</span>
                        <span>·</span>
                        <span>{master.categories.join(', ')}</span>
                        <span>·</span>
                        <span>С {format(parseISO(master.created_at), 'd MMM yyyy', { locale: ru })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" render={<a href={`/masters/${master.id}`} target="_blank" rel="noopener noreferrer" />}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Профиль
                      </Button>

                      {!master.is_verified && (
                        <Button size="sm" onClick={() => handleVerify(master.id)}
                          disabled={loading === master.id}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <Shield className="w-3.5 h-3.5 mr-1" />
                          {loading === master.id ? '...' : 'Верифицировать'}
                        </Button>
                      )}

                      {!isBoosted && (
                        <Button variant="outline" size="sm" onClick={() => handleBoost(master.id)}
                          disabled={loading === master.id}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50">
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          Буст
                        </Button>
                      )}

                      {master.is_active ? (
                        <Button variant="ghost" size="sm" onClick={() => handleDeactivate(master.id)}
                          disabled={loading === master.id}
                          className="text-destructive hover:bg-destructive/10">
                          <ShieldOff className="w-3.5 h-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
