'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

function RegisterForm() {
  const { pending } = useFormStatus()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [role, setRole] = useState<'client' | 'master'>('client')

  return (
    <form
      action={async (formData) => {
        formData.set('role', role)
        const result = await registerAction(formData)
        if (!result.success) {
          setErrors(result.fieldErrors || {})
          toast.error(result.error)
        }
      }}
      className="space-y-4 w-full"
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Имя и фамилия</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Иван Петров"
          disabled={pending}
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName[0]}</p>}
      </div>

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
        <p className="text-xs text-muted-foreground">
          Минимум 8 символов, заглавная буква и цифра
        </p>
      </div>

      <div className="space-y-3">
        <Label>Кто вы?</Label>
        <RadioGroup value={role} onValueChange={(value) => setRole(value as 'client' | 'master')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="client" id="client" disabled={pending} />
            <Label htmlFor="client" className="font-normal cursor-pointer">
              Клиент — буду записываться к мастерам
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="master" id="master" disabled={pending} />
            <Label htmlFor="master" className="font-normal cursor-pointer">
              Мастер — буду принимать клиентов
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Регистрация...' : 'Зарегистрироваться'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Войдите
        </Link>
      </p>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Создайте новый аккаунт</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  )
}
