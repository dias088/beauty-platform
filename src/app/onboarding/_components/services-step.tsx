'use client'

import { useState, useEffect } from 'react'
import { addServiceAction, deleteServiceAction, completeOnboardingAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SERVICE_CATEGORIES } from '@/lib/validations/master'

const CATEGORY_LABELS: Record<string, string> = {
  nail: 'Ногти',
  lash: 'Ресницы',
  brow: 'Брови',
  hair: 'Волосы',
  makeup: 'Макияж',
  cosmetology: 'Косметология',
}

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480]

type Service = {
  id: string
  name: string
  category: string
  price_kzt: number
  duration_minutes: number
  description?: string
}

function AddServiceDialog({ masterCategories, onServiceAdded }: { masterCategories: string[]; onServiceAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: masterCategories[0] || '',
    price_kzt: '',
    duration_minutes: '60',
    description: '',
  })

  // When categories load, default to the first one
  useEffect(() => {
    if (masterCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: masterCategories[0] }))
    }
  }, [masterCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await addServiceAction({
      name: formData.name,
      category: formData.category,
      price_kzt: parseInt(formData.price_kzt),
      duration_minutes: parseInt(formData.duration_minutes),
      description: formData.description || undefined,
    })

    setLoading(false)

    if (result.success) {
      toast.success('Услуга добавлена')
      setFormData({ name: '', category: masterCategories[0] || '', price_kzt: '', duration_minutes: '60', description: '' })
      setOpen(false)
      onServiceAdded()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Добавить услугу
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая услуга</DialogTitle>
          <DialogDescription>Добавьте услугу которую вы предоставляете</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название услуги</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Маникюр классический"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="category">Категория</Label>
            <Select value={formData.category} onValueChange={(val) => val && setFormData(prev => ({ ...prev, category: val }))}>
              <SelectTrigger id="category" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {masterCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Цена (тенге)</Label>
            <Input
              id="price"
              type="number"
              min="500"
              value={formData.price_kzt}
              onChange={(e) => setFormData(prev => ({ ...prev, price_kzt: e.target.value }))}
              placeholder="5000"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="duration">Длительность (минуты)</Label>
            <Select value={formData.duration_minutes} onValueChange={(val) => val && setFormData(prev => ({ ...prev, duration_minutes: val }))}>
              <SelectTrigger id="duration" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map(d => (
                  <SelectItem key={d} value={d.toString()}>
                    {d} мин
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Описание (опционально)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Подробное описание услуги..."
              disabled={loading}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading || !formData.name || !formData.price_kzt}>
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ServicesStep() {
  const [services, setServices] = useState<Service[]>([])
  const [masterCategories, setMasterCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: master } = await supabase.from('masters').select('id, categories').eq('profile_id', user.id).single()
      if (!master) return

      setMasterCategories(master.categories || [])

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('master_id', master.id)

      if (servicesData) {
        setServices(servicesData.map(s => ({ ...s, description: s.description ?? undefined })))
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleDeleteService = async (serviceId: string) => {
    const result = await deleteServiceAction(serviceId)
    if (result.success) {
      setServices(prev => prev.filter(s => s.id !== serviceId))
      toast.success('Услуга удалена')
    } else {
      toast.error(result.error)
    }
  }

  const handleComplete = async () => {
    if (services.length === 0) {
      toast.error('Добавьте хотя бы одну услугу')
      return
    }

    setCompleting(true)
    const result = await completeOnboardingAction()
    if (result && !result.success) {
      toast.error(result.error)
      setCompleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-4">Ваши услуги</h3>

            {services.length === 0 ? (
              <p className="text-muted-foreground text-sm mb-4">Услуг ещё не добавлено</p>
            ) : (
              <div className="space-y-2 mb-4">
                {services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {CATEGORY_LABELS[service.category]} • {service.price_kzt.toLocaleString('ru')} ₸ • {service.duration_minutes} мин
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AddServiceDialog masterCategories={masterCategories} onServiceAdded={() => {
            // Перезагрузить услуги
            supabase.auth.getUser().then(async ({ data: { user } }) => {
              if (!user) return
              const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
              if (!master) return
              const { data: servicesData } = await supabase.from('services').select('*').eq('master_id', master.id)
              if (servicesData) setServices(servicesData.map(s => ({ ...s, description: s.description ?? undefined })))
            })
          }} />
        </div>
      </Card>

      <div className="flex justify-between gap-4">
        <Button variant="outline" disabled={completing}>
          Назад
        </Button>
        <Button onClick={handleComplete} disabled={completing || services.length === 0}>
          {completing ? 'Завершение...' : 'Готово'}
        </Button>
      </div>
    </div>
  )
}
