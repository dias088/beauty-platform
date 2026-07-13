'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Search, ChevronDown, ChevronUp, Phone, MessageSquare, Star } from 'lucide-react'
import { saveCrmNoteAction } from '../actions'
import { getClientBookingsForMaster } from '@/lib/queries/crm'
import type { CrmClient, CrmBooking } from '@/lib/queries/crm'
import { createClient } from '@/lib/supabase/client'

const LEVEL_STYLE = {
  new:      { label: 'Новый',       cls: 'bg-[rgba(96,165,250,0.14)] text-[#93c5fd]' },
  verified: { label: 'Проверенный', cls: 'bg-[rgba(251,191,36,0.14)] text-[#fbbf24]' },
  trusted:  { label: 'Доверенный',  cls: 'bg-[rgba(16,185,129,0.14)] text-[#34d399]' },
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  completed:           { label: 'Завершена',        cls: 'bg-[rgba(16,185,129,0.14)] text-[#34d399]' },
  confirmed:           { label: 'Подтверждена',     cls: 'bg-[rgba(96,165,250,0.14)] text-[#93c5fd]' },
  pending:             { label: 'Ожидает',          cls: 'bg-[rgba(251,191,36,0.14)] text-[#fbbf24]' },
  cancelled_by_client: { label: 'Отменена',         cls: 'bg-[rgba(239,68,68,0.14)] text-[#f87171]' },
  cancelled_by_master: { label: 'Отменена мастером',cls: 'bg-[rgba(239,68,68,0.14)] text-[#f87171]' },
  no_show:             { label: 'Не пришёл',        cls: 'bg-[rgba(239,68,68,0.14)] text-[#f87171]' },
}

type Props = { clients: CrmClient[]; masterId: string }

export function CrmClientList({ clients, masterId }: Props) {
  const [search, setSearch]           = useState('')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [bookings, setBookings]       = useState<Record<string, CrmBooking[]>>({})
  const [notes, setNotes]             = useState<Record<string, string>>({})
  const [savingNote, setSavingNote]   = useState<string | null>(null)
  const [loadingHist, setLoadingHist] = useState<string | null>(null)

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  const toggleExpand = async (clientId: string) => {
    if (expanded === clientId) { setExpanded(null); return }
    setExpanded(clientId)

    if (!bookings[clientId]) {
      setLoadingHist(clientId)
      // Fetch через supabase client напрямую (CRM query — server only, но для simplicity используем supabase client)
      const supabase = createClient()
      const { data } = await supabase
        .from('bookings')
        .select('id, starts_at, status, service_name_snapshot, price_kzt_snapshot, discount_pct, client_notes, master_notes')
        .eq('master_id', masterId)
        .eq('client_id', clientId)
        .order('starts_at', { ascending: false })
      setBookings(prev => ({ ...prev, [clientId]: (data as CrmBooking[]) ?? [] }))
      setLoadingHist(null)
    }
  }

  const handleSaveNote = async (clientId: string) => {
    setSavingNote(clientId)
    const result = await saveCrmNoteAction(clientId, notes[clientId] ?? '')
    setSavingNote(null)
    if (result.success) toast.success('Заметка сохранена')
    else toast.error(result.error)
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Пока нет клиентов</p>
        <p className="text-sm mt-1">Они появятся после первых записей</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Поиск по имени или телефону..." className="pl-9"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
      )}

      {/* Список клиентов */}
      {filtered.map(client => {
        const lvl  = LEVEL_STYLE[client.level as keyof typeof LEVEL_STYLE] ?? LEVEL_STYLE.new
        const cid  = client.client_id
        const isEx = expanded === cid

        return (
          <Card key={cid} className="overflow-hidden">
            {/* Строка клиента */}
            <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
              onClick={() => toggleExpand(cid)}>
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={client.avatar_url ?? undefined} />
                  <AvatarFallback>{client.full_name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{client.full_name}</span>
                    <Badge className={`${lvl.cls} border-0 text-xs`}>{lvl.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span>{client.total_visits} визит{client.total_visits !== 1 ? 'ов' : ''}</span>
                    <span>·</span>
                    <span>{client.total_spent.toLocaleString('ru')} ₸ потрачено</span>
                    {client.last_visit && (
                      <>
                        <span>·</span>
                        <span>Последний: {format(parseISO(client.last_visit), 'd MMM yyyy', { locale: ru })}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {client.phone && (
                    <a href={`tel:${client.phone}`} onClick={e => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {client.score}
                  </div>
                  {expanded === cid ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            {/* Раскрытая панель */}
            {expanded === cid && (
              <div className="border-t bg-muted/20 p-4 space-y-4">
                {/* Заметка */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Заметка о клиенте
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Аллергии, предпочтения, особые пожелания..."
                      value={notes[cid] ?? client.notes ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [cid]: e.target.value }))}
                      className="resize-none text-sm" rows={2}
                    />
                    <Button size="sm" className="shrink-0 self-start"
                      onClick={() => handleSaveNote(cid)}
                      disabled={savingNote === cid}>
                      {savingNote === cid ? '...' : 'Сохранить'}
                    </Button>
                  </div>
                </div>

                {/* История записей */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    История визитов
                  </label>
                  {loadingHist === cid ? (
                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                  ) : (bookings[cid] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Нет записей</p>
                  ) : (
                    <div className="space-y-2">
                      {(bookings[cid] ?? []).map(b => {
                        const st = STATUS_STYLE[b.status] ?? { label: b.status, cls: 'bg-white/10 text-[var(--text-2)]' }
                        return (
                          <div key={b.id} className="flex items-center justify-between rounded-lg bg-background border px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium">{b.service_name_snapshot}</span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {format(parseISO(b.starts_at), 'd MMM yyyy HH:mm', { locale: ru })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                              <span className="font-semibold text-sm">
                                {b.price_kzt_snapshot.toLocaleString('ru')} ₸
                                {b.discount_pct && <span className="text-green-600 text-xs ml-1">-{b.discount_pct}%</span>}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
