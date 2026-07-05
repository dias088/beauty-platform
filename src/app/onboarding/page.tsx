import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from './_components/onboarding-flow'

export default async function OnboardingPage(props: {
  searchParams: Promise<{ step?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'master') redirect('/')

  const { data: masterInfo } = await supabase.from('masters').select('*').eq('profile_id', user.id).single()
  const step = parseInt(searchParams?.step || '1')

  return <OnboardingFlow step={step} masterInfo={masterInfo} userName={profile?.full_name ?? ''} />
}
