import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './_profile-form'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Профиль</h1>
      <ProfileForm
        fullName={profile?.full_name ?? ''}
        email={user!.email ?? ''}
      />
    </main>
  )
}
