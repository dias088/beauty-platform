'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { loginAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function LoginForm() {
  const { pending } = useFormStatus()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  return (
    <form
      action={async (formData) => {
        const result = await loginAction(formData)
        if (!result.success) {
          setErrors(result.fieldErrors || {})
          toast.error(result.error)
        }
      }}
      className="space-y-4 w-full"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="example@mail.com"
          disabled={pending}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          disabled={pending}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password[0]}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Вход...' : 'Войти'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Зарегистрируйтесь
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вход</CardTitle>
        <CardDescription>Войдите в свой аккаунт</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
