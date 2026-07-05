'use client'

import { useState, useTransition } from 'react'
import { updateClientProfileAction } from '../actions'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  fullName: string
  email: string
}

export function ProfileForm({ fullName, email }: ProfileFormProps) {
  const [name, setName] = useState(fullName)
  const [isPending, startTransition] = useTransition()

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateClientProfileAction(name)
      if (result.success) toast.success('Профиль обновлён')
      else toast.error(result.error)
    })
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold mb-3">
          {initials}
        </div>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Имя</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ваше имя"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <Input value={email} readOnly className="bg-muted cursor-not-allowed" />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</> : 'Сохранить'}
        </button>
      </div>
    </Card>
  )
}
