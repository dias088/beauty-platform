'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MasterCard } from '@/components/shared/master-card'
import { MasterMap } from '@/components/shared/master-map'
import { FiltersBar } from './filters-bar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, List } from 'lucide-react'
import type { MasterListItem } from '@/lib/queries/masters'

type Props = {
  initialMasters: MasterListItem[]
  isAuthenticated: boolean
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <p className="text-5xl mb-4">🔍</p>
      <p className="font-semibold text-lg mb-2">Мастеров не найдено</p>
      <p className="text-sm text-muted-foreground">
        Попробуйте изменить фильтры или сбросить поиск
      </p>
    </div>
  )
}

export function MasterListMap({ initialMasters: masters, isAuthenticated }: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const router = useRouter()

  const handleMasterSelect = (masterId: string) => {
    setSelectedId(masterId)
    const element = document.getElementById(`master-${masterId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)]">
      <FiltersBar />

      {/* Desktop: двухколоночный макет */}
      <div className="hidden md:grid md:grid-cols-2 flex-1 gap-0 overflow-hidden">
        {/* Список слева */}
        <div className="overflow-y-auto border-r">
          {masters.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="px-4 pt-3 pb-2 text-xs text-muted-foreground font-medium">
                {masters.length} мастеров
              </div>
              <div className="px-4 pb-6 space-y-3">
                {masters.map(master => (
                  <div
                    key={master.id}
                    id={`master-${master.id}`}
                    className={`relative transition-all rounded-xl ${
                      selectedId === master.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <MasterCard master={master} />
                    <button
                      onClick={() => handleMasterSelect(master.id)}
                      className="absolute left-0 top-0 bottom-0 w-3 z-10 opacity-0"
                      aria-label="Показать на карте"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Карта справа */}
        <div className="h-full">
          <MasterMap masters={masters} selectedId={selectedId} onSelect={handleMasterSelect} />
        </div>
      </div>

      {/* Mobile: вкладки */}
      <div className="md:hidden flex-1 overflow-hidden">
        <Tabs defaultValue="list" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b shrink-0 h-11 bg-background">
            <TabsTrigger value="list" className="flex-1 gap-1.5 data-[state=active]:bg-muted">
              <List className="w-4 h-4" />
              Список
              {masters.length > 0 && (
                <span className="text-xs text-muted-foreground">({masters.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 gap-1.5 data-[state=active]:bg-muted">
              <Map className="w-4 h-4" />
              Карта
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
            {masters.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3 pb-4">
                {masters.map(master => (
                  <MasterCard key={master.id} master={master} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="flex-1 p-0 m-0 data-[state=inactive]:hidden">
            <MasterMap masters={masters} selectedId={selectedId} onSelect={handleMasterSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
