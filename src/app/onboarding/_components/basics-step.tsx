'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveBasicsAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import type { SERVICE_CATEGORIES } from '@/lib/validations/master'

const CATEGORIES_LIST: Array<typeof SERVICE_CATEGORIES[number]> = [
  'nail',
  'lash',
  'brow',
  'hair',
  'makeup',
  'cosmetology',
]

const CATEGORY_LABELS: Record<string, string> = {
  nail: '💅 Ногти',
  lash: '✨ Ресницы',
  brow: '👁️ Брови',
  hair: '💇 Волосы',
  makeup: '💄 Макияж',
  cosmetology: '🧴 Косметология',
}

function BasicsForm({ initialData }: { initialData?: any }) {
  const { pending } = useFormStatus()
  const [bio, setBio] = useState(initialData?.bio || '')
  const [selected, setSelected] = useState<string[]>(initialData?.categories || [])
  const [instagram, setInstagram] = useState(initialData?.instagram_handle || '')
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const toggleCategory = (cat: string) => {
    setSelected(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  return (
    <form
      action={async (formData) => {
        selected.forEach(cat => formData.append('categories', cat))
        const result = await saveBasicsAction(formData)
        if (!result.success) {
          setErrors(result.fieldErrors || {})
          toast.error(result.error)
        }
      }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="bio">О вас и вашем опыте</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Расскажите о себе, вашем опыте, специализации..."
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={pending}
              className={errors.bio ? 'border-red-500' : ''}
            />
            <div className="flex justify-between mt-2">
              <div className="text-sm text-muted-foreground">
                {bio.length} / 1000
              </div>
              {errors.bio && <p className="text-sm text-red-500">{errors.bio[0]}</p>}
            </div>
          </div>

          <div>
            <Label>Категории услуг</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
              {CATEGORIES_LIST.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  disabled={pending}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selected.includes(cat)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            {errors.categories && (
              <p className="text-sm text-red-500 mt-2">{errors.categories[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="instagram">Instagram (опционально)</Label>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">@</span>
              <Input
                id="instagram"
                name="instagram"
                placeholder="username"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={pending}
                className={errors.instagram ? 'border-red-500' : ''}
              />
            </div>
            {errors.instagram && <p className="text-sm text-red-500 mt-1">{errors.instagram[0]}</p>}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || bio.length < 50 || selected.length === 0}>
          {pending ? 'Сохранение...' : 'Далее'}
        </Button>
      </div>
    </form>
  )
}

export function BasicsStep({ initialData }: { initialData?: any }) {
  return <BasicsForm initialData={initialData} />
}
