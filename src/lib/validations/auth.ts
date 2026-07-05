import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

export const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Должна быть заглавная буква')
    .regex(/[0-9]/, 'Должна быть цифра'),
  fullName: z.string().min(2, 'Минимум 2 символа').max(100),
  role: z.enum(['client', 'master']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
