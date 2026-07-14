import { z } from 'zod'

export const SERVICE_CATEGORIES = ['nail', 'lash', 'brow', 'hair', 'makeup', 'cosmetology'] as const

export const masterBasicsSchema = z.object({
  bio: z.string().min(20, 'Расскажите о себе — минимум 20 символов').max(1000),
  categories: z.array(z.enum(SERVICE_CATEGORIES)).min(1, 'Выберите хотя бы одну категорию'),
  instagram: z.string().regex(/^[a-zA-Z0-9._]{1,30}$/, 'Только буквы, цифры, точки').optional().or(z.literal('')),
})

export const masterLocationSchema = z.object({
  address: z.string().min(10, 'Полный адрес'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const masterServiceSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.enum(SERVICE_CATEGORIES),
  price_kzt: z.number().int().min(500).max(1000000),
  duration_minutes: z.number().int().min(15).max(480),
  description: z.string().max(500).optional(),
})

export type MasterBasicsInput = z.infer<typeof masterBasicsSchema>
export type MasterLocationInput = z.infer<typeof masterLocationSchema>
export type MasterServiceInput = z.infer<typeof masterServiceSchema>
