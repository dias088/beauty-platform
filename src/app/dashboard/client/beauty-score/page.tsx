import { createClient } from '@/lib/supabase/server'
import { getClientScore } from '@/lib/queries/client-bookings'
import { BeautyScoreDetails } from '../_components/beauty-score-details'

export default async function BeautyScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const score = await getClientScore(user!.id)

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Beauty Score</h1>
      {score ? (
        <BeautyScoreDetails score={score} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">Сделайте первую запись, чтобы получить Beauty Score</p>
        </div>
      )}
    </main>
  )
}
