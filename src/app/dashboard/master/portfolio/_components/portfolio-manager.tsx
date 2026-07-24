'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { savePhotoRecordAction, deletePortfolioPhotoAction } from '@/app/onboarding/actions'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'
import { X, ImagePlus, Loader2 } from 'lucide-react'

type Photo = { id: string; url: string; position: number }

const MAX_PHOTOS = 10

export function PortfolioManager() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const supabase = createClient()
  const isUploading = Object.values(uploading).some(Boolean)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
      if (!master) return
      const { data } = await supabase
        .from('portfolio_photos')
        .select('id, url, position')
        .eq('master_id', master.id)
        .order('position', { ascending: true })
      if (data) setPhotos(data)
      setLoading(false)
    }
    load()
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Войдите снова'); return }

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) { toast.error(`Максимум ${MAX_PHOTOS} фото`); return }
    const files = acceptedFiles.slice(0, room)

    for (const file of files) {
      if (file.size > 5242880) { toast.error(`${file.name} больше 5MB`); continue }

      const fileId = crypto.randomUUID()
      setUploading(prev => ({ ...prev, [fileId]: true }))
      try {
        const ext = file.name.split('.').pop()
        const path = `portfolio/${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
        if (uploadError) { toast.error('Не удалось загрузить фото'); continue }

        const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path)
        const result = await savePhotoRecordAction({ url: publicUrl.publicUrl, storagePath: path })
        if (result.success) {
          setPhotos(prev => [...prev, { id: result.data!.id, url: publicUrl.publicUrl, position: prev.length }])
          toast.success('Фото добавлено')
        } else {
          toast.error(result.error)
        }
      } finally {
        setUploading(prev => { const s = { ...prev }; delete s[fileId]; return s })
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 5242880,
    disabled: photos.length >= MAX_PHOTOS,
  })

  const handleDelete = async (photoId: string) => {
    const prev = photos
    setPhotos(p => p.filter(x => x.id !== photoId)) // оптимистично
    const result = await deletePortfolioPhotoAction(photoId)
    if (result.success) {
      toast.success('Фото удалено')
    } else {
      setPhotos(prev) // откат
      toast.error(result.error)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            photos.length >= MAX_PHOTOS
              ? 'cursor-not-allowed opacity-50 border-muted-foreground/25'
              : isDragActive
                ? 'cursor-pointer border-[var(--violet)] bg-[rgba(255,45,120,0.06)]'
                : 'cursor-pointer border-muted-foreground/25 hover:border-[var(--violet)]/40'
          }`}
        >
          <input {...getInputProps()} />
          <ImagePlus className="mx-auto mb-3 h-8 w-8 text-[var(--violet-bright)]" />
          <p className="text-lg font-medium">
            {photos.length >= MAX_PHOTOS ? 'Достигнут лимит фото' : 'Перетащите фото сюда'}
          </p>
          {photos.length < MAX_PHOTOS && (
            <p className="mt-1 text-sm text-muted-foreground">или кликните для выбора</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">JPEG, PNG, WebP до 5MB · {photos.length} / {MAX_PHOTOS}</p>
        </div>

        {photos.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo, i) => (
              <div key={photo.id} className="group relative">
                <Image
                  src={photo.url}
                  alt={`Работа ${i + 1}`}
                  width={160}
                  height={160}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-[var(--violet)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Обложка
                  </span>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  aria-label="Удалить фото"
                  className="absolute right-1.5 top-1.5 rounded bg-red-500/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
          </div>
        )}
      </Card>

      <p className="text-sm text-muted-foreground">
        Первое фото — обложка карточки в каталоге. Порядок пока по времени добавления;
        чтобы сменить обложку, удалите лишние и загрузите нужное первым.
      </p>
    </div>
  )
}
