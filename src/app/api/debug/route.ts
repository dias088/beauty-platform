import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('masters')
    .select('id, is_active, categories')
    .eq('is_active', true)
  
  return NextResponse.json({ data, error })
}