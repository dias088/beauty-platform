'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createServiceAction, updateServiceAction, deleteServiceAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2, Edit2, Plus, X } from 'lucide-react'

const CATEGORIES = [
  { value: 'nail', label: '💅 Ногти' },
  { value: 'lash', label: '✨ Ресницы' },
  { value: 'brow', label: '👁️ Брови' },
  { value: 'hair', label: '💇 Волосы' },
  { value: 'makeup', label: '💄 Макияж' },
  { value: 'cosmetology', label: '🧴 Косметология' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
)

const EMPTY_FORM = {
  name: '',
  category: '',
  price_kzt: 0,
  duration_minutes: 60,
  description: '',
}

type FormMode = { type: 'create' } | { type: 'edit'; id: string } | null

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [mode, setMode] = useState<FormMode>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const supabase = createClient()

  const loadServices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: master } = await supabase
      .from('masters')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!master) return

    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('master_id', master.id)
      .order('created_at', { ascending: true })

    setServices(data || [])
  }

  useEffect(() => {
    loadServices()
  }, [])

  const openCreate = () => {
    setFormData(EMPTY_FORM)
    setMode({ type: 'create' })
  }

  const openEdit = (service: any) => {
    setFormData({
      name: service.name,
      category: service.category,
      price_kzt: service.price_kzt,
      duration_minutes: service.duration_minutes,
      description: service.description || '',
    })
    setMode({ type: 'edit', id: service.id })
  }

  const closeForm = () => {
    setMode(null)
    setFormData(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || formData.price_kzt <= 0) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setLoading(true)

    const result = mode?.type === 'edit'
      ? await updateServiceAction(
          mode.id,
          formData.name,
          formData.category,
          formData.price_kzt,
          formData.duration_minutes,
          formData.description || undefined
        )
      : await createServiceAction(
          formData.name,
          formData.category,
          formData.price_kzt,
          formData.duration_minutes,
          formData.description || undefined
        )

    setLoading(false)

    if (result.success) {
      toast.success(mode?.type === 'edit' ? 'Услуга обновлена' : 'Услуга добавлена')
      closeForm()
      loadServices()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (serviceId: string) => {
    setLoading(true)
    const result = await deleteServiceAction(serviceId)
    setLoading(false)

    if (result.success) {
      toast.success('Услуга удалена')
      loadServices()
    } else {
      toast.error(result.error)
    }
  }

  const isFormOpen = mode !== null

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Услуги</h1>
        {!isFormOpen && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Добавить услугу
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма создания / редактирования */}
        {isFormOpen && (
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {mode?.type === 'create' ? 'Новая услуга' : 'Редактировать'}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название *</label>
                <Input
                  placeholder="Маникюр с покрытием"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Категория *</label>
                <Select
                  value={formData.category}
                  onValueChange={cat => cat && setFormData({ ...formData, category: cat })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Цена (₸) *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5000"
                  value={formData.price_kzt || ''}
                  onChange={e => setFormData({ ...formData, price_kzt: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Длительность (мин)</label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  placeholder="Кратко о процедуре..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={closeForm}>
                  Отмена
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={loading}>
                  {loading ? 'Сохранение...' : mode?.type === 'create' ? 'Добавить' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Список услуг */}
        <div className={isFormOpen ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
              <p className="text-lg font-medium mb-2">Услуги не добавлены</p>
              <p className="text-sm mb-4">Добавьте первую услугу, чтобы клиенты могли записываться</p>
              {!isFormOpen && (
                <Button onClick={openCreate} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить услугу
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(service => (
                <Card key={service.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {CATEGORY_LABELS[service.category] ?? service.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-base">
                      {service.price_kzt.toLocaleString('ru')} ₸
                    </p>
                    <p className="text-muted-foreground">{service.duration_minutes} мин</p>
                    {service.description && (
                      <p className="text-muted-foreground line-clamp-2">{service.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
