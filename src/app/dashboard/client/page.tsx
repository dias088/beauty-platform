import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getClientBookings } from '@/lib/queries/client-bookings'
import { ClientBookingCard } from './_components/client-booking-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarCheck, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const bookings = await getClientBookings(user.id)

  const now = new Date()
  const upcoming = bookings.filter(
    b => new Date(b.starts_at) > now &&
    b.status !== 'cancelled_by_client' &&
    b.status !== 'cancelled_by_master'
  )
  const past = bookings.filter(
    b => new Date(b.starts_at) <= now &&
    b.status !== 'cancelled_by_client' &&
    b.status !== 'cancelled_by_master'
  )
  const cancelled = bookings.filter(
    b => b.status === 'cancelled_by_client' || b.status === 'cancelled_by_master'
  )

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Мой кабинет</h1>
        <p className="text-muted-foreground mt-1">Мои записи</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <CalendarCheck className="w-4 h-4" />
            Предстоящие
            {upcoming.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
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

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Нет предстоящих записей</p>
              <Link href="/" className="text-sm text-primary hover:underline mt-2 inline-block">
                Найти мастера →
              </Link>
            </div>
          ) : (
            upcoming.map(b => <ClientBookingCard key={b.id} booking={b} canCancel />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {past.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет прошедших записей</p>
            </div>
          ) : (
            past.map(b => <ClientBookingCard key={b.id} booking={b} canCancel={false} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelled.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет отменённых записей</p>
            </div>
          ) : (
            cancelled.map(b => <ClientBookingCard key={b.id} booking={b} canCancel={false} />)
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
