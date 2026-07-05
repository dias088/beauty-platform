'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { savePhotoRecordAction, deletePortfolioPhotoAction, reorderPortfolioAction, completePhotosStepAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import Image from 'next/image'
import { X, GripVertical } from 'lucide-react'

type Photo = {
  id: string
  url: string
  position: number
}

export function PhotosStep() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  // Загруз существующие фото при монтировании
  useEffect(() => {
    const loadPhotos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: master } = await supabase.from('masters').select('id').eq('profile_id', user.id).single()
      if (!master) return

      const { data, error } = await supabase
        .from('portfolio_photos')
        .select('id, url, position')
        .eq('master_id', master.id)
        .order('position', { ascending: true })

      if (!error && data) {
        setPhotos(data)
      }
      setLoading(false)
    }

    loadPhotos()
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Войдите снова')
      return
    }

    for (const file of acceptedFiles) {
      if (file.size > 5242880) {
        toast.error(`${file.name} больше 5MB`)
        continue
      }

      const fileId = Math.random().toString()
      setUploading(prev => ({ ...prev, [fileId]: true }))

      try {
        const ext = file.name.split('.').pop()
        const path = `portfolio/${user.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, file)

        if (uploadError) {
          toast.error('Не удалось загрузить фото')
          continue
        }

        const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path)

        const result = await savePhotoRecordAction({
          url: publicUrl.publicUrl,
          storagePath: path,
        })

        if (result.success) {
          setPhotos(prev => [...prev, {
            id: result.data!.id,
            url: publicUrl.publicUrl,
            position: prev.length,
          }])
          toast.success('Фото загружено')
        } else {
          toast.error(result.error)
        }
      } finally {
        setUploading(prev => {
          const newState = { ...prev }
          delete newState[fileId]
          return newState
        })
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 5242880,
  })

  const handleDelete = async (photoId: string) => {
    const result = await deletePortfolioPhotoAction(photoId)
    if (result.success) {
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      toast.success('Фото удалено')
    } else {
      toast.error(result.error)
    }
  }

  const handleComplete = async () => {
    if (photos.length < 3) {
      toast.error('Загрузите минимум 3 фото')
      return
    }
    await completePhotosStepAction()
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-lg font-medium">Перетащите фото сюда</p>
          <p className="text-sm text-muted-foreground mt-2">или кликните для выбора</p>
          <p className="text-xs text-muted-foreground mt-4">JPEG, PNG, WebP до 5MB</p>
        </div>

        {photos.length > 0 && (
          <div className="mt-6">
            <div className="text-sm text-muted-foreground mb-4">
              Загружено: {photos.length} / 10. Минимум 3.
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <Image
                    src={photo.url}
                    alt="Portfolio"
                    width={120}
                    height={120}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between gap-4">
        <Button variant="outline" disabled={false}>
          Назад
        </Button>
        <Button
          onClick={handleComplete}
          disabled={photos.length < 3 || Object.values(uploading).some(v => v)}
        >
          {Object.values(uploading).some(v => v) ? 'Загрузка...' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}
