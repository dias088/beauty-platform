import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Временный диагностический роут: показывает, что сервер реально видит
// для текущей сессии (id, email, роль из profiles тем же запросом, что и
// охранник кабинета мастера). Удалить после отладки.
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userErr } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ loggedIn: false, userError: userErr?.message ?? 'no user' })
  }

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const { data: master } = await supabase
    .from('masters')
    .select('id, is_active')
    .eq('profile_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    loggedIn: true,
    userId: user.id,
    email: user.email,
    profileRole: profile?.role ?? null,
    profileFullName: profile?.full_name ?? null,
    profileError: profErr?.message ?? null,
    hasMasterRecord: !!master,
    masterActive: master?.is_active ?? null,
    wouldOpenMasterDashboard: profile?.role === 'master',
  })
}
