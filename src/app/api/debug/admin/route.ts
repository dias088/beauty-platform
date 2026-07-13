import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Временная диагностика: проверяет, работает ли service_role ключ.
// Читает активных мастеров АДМИН-клиентом (как getMasters/каталог).
// Удалить после проверки.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('masters')
      .select('id, is_active')
      .eq('is_active', true)

    return NextResponse.json({
      adminClientWorks: !error,
      count: data?.length ?? 0,
      error: error?.message ?? null,
      // подсказка по формату ключа (без утечки самого ключа)
      serviceKeyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').slice(0, 3),
    })
  } catch (e) {
    return NextResponse.json({ adminClientWorks: false, thrown: String(e) })
  }
}
