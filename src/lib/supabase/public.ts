import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Бескуковый анонимный клиент для ПУБЛИЧНЫХ чтений (каталог мастеров).
 * Не привязан к запросу/сессии — поэтому запросы через него можно
 * кешировать (unstable_cache). Доступ ограничивают публичные RLS-политики.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
