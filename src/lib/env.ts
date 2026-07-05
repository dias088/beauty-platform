import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1),
  NEXT_PUBLIC_YANDEX_MAPS_KEY:   z.string().optional(),
  NEXT_PUBLIC_APP_URL:           z.string().url(),
  RESEND_API_KEY:                z.string().optional(),
  // Администраторы платформы — через запятую
  ADMIN_EMAILS:                  z.string().default('medetsovetov09@gmail.com,diaskalm45@gmail.com'),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_YANDEX_MAPS_KEY:   process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY,
  NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY:                process.env.RESEND_API_KEY,
  ADMIN_EMAILS:                  process.env.ADMIN_EMAILS,
})
