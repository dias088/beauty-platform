import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCrmClients } from '@/lib/queries/crm'
import { CrmClientList } from './_components/crm-client-list'

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
  if (!master) redirect('/onboarding')

  const clients = await getCrmClients(master.id)

  return (
    <main className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {clients.length} клиентов · история визитов и заметки
        </p>
      </div>
      <CrmClientList clients={clients} masterId={master.id} />
    </main>
  )
}
