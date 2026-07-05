import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMasterBookings } from '@/lib/queries/master-bookings'
import { BookingCard } from './_components/booking-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, CalendarCheck, Clock, XCircle } from 'lucide-react'

type Props = {
  searchParams: Promise<{ welcome?: string }>
}

export default async function MasterDashboardPage({ searchParams }: Props) {
  const { welcome } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: master } = await supabase
    .from('masters')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!master) redirect('/onboarding?step=1')

  const bookings = await getMasterBookings(master.id)

  const now = new Date()
  const upcoming = bookings.filter(
    b => new Date(b.starts_at) > now &&
    b.status !== 'cancelled_by_master' &&
    b.status !== 'cancelled_by_client'
  )
  const past = bookings.filter(
    b => new Date(b.starts_at) <= now &&
    b.status !== 'cancelled_by_master' &&
    b.status !== 'cancelled_by_client'
  )
  const cancelled = bookings.filter(
    b => b.status === 'cancelled_by_master' || b.status === 'cancelled_by_client'
  )

  return (
    <main className="container mx-auto py-8 px-4 md:px-8 max-w-4xl">
      {welcome && (
        <Alert className="mb-8 border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-100">Поздравляем!</AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            Ваш профиль создан и активирован. Теперь клиенты могут записываться к вам!
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Мои записи</h1>
        <p className="text-muted-foreground mt-1">Управляйте клиентскими записями</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <CalendarCheck className="w-4 h-4" />
            Предстоящие
            {upcoming.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="w-4 h-4" />
            Прошедшие ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="w-4 h-4" />
            Отменённые ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет предстоящих записей</p>
            </div>
          ) : (
            upcoming.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет прошедших записей</p>
            </div>
          ) : (
            past.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-3">
          {cancelled.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет отменённых записей</p>
            </div>
          ) : (
            cancelled.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
