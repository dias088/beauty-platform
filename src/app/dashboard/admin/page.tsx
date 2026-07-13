import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './_components/admin-dashboard'

const ADMIN_EMAILS = env.ADMIN_EMAILS.split(',').map(e => e.trim())

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!ADMIN_EMAILS.includes(user.email ?? '')) redirect('/')

  const admin = createAdminClient()

  const [mastersRes, bookingsRes, profilesRes] = await Promise.all([
    admin
      .from('masters')
      .select('id, is_verified, is_active, created_at, boost_until, rating, reviews_count, completed_bookings, categories, profiles!masters_profile_id_fkey!inner(full_name, avatar_url)')
      .order('created_at', { ascending: false }),
    admin
      .from('bookings')
      .select('id, status, created_at, price_kzt_snapshot')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from('profiles')
      .select('id, role, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const masters  = (mastersRes.data  ?? []) as any[]
  const bookings = (bookingsRes.data ?? []) as any[]
  const profiles = (profilesRes.data ?? []) as any[]

  const stats = {
    totalMasters:      masters.length,
    verifiedMasters:   masters.filter(m => m.is_verified).length,
    pendingMasters:    masters.filter(m => !m.is_verified && m.is_active).length,
    totalBookings30d:  bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    revenue30d:        bookings.filter(b => b.status === 'completed').reduce((s: number, b: any) => s + b.price_kzt_snapshot, 0),
    totalClients:      profiles.filter(p => p.role === 'client').length,
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin панель</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Beauty Platform · {user.email}</p>
          </div>
        </div>
        <AdminDashboard stats={stats} masters={masters} recentProfiles={profiles} />
      </div>
    </main>
  )
}
