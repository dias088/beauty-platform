'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateAvatarAction } from '@/app/account/actions'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'

function initialsOf(name: string) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

/**
 * Загрузка/смена фото профиля. Самодостаточный: сам подгружает текущий
 * avatar_url и имя. Файл летит в media-бакет, ссылка сохраняется в profiles.
 */
export function AvatarUpload() {
  const [url, setUrl] = useState('')
  const [fullName, setFullName] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single()
      if (data) {
        setUrl(data.avatar_url || '')
        setFullName(data.full_name || '')
      }
    }
    load()
  }, [])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // чтобы можно было выбрать тот же файл повторно
    if (!file) return
    if (file.size > 5242880) { toast.error('Файл больше 5MB'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Войдите снова'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file)
      if (upErr) { toast.error('Не удалось загрузить'); return }

      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      const res = await updateAvatarAction(pub.publicUrl)
      if (res.success) {
        setUrl(pub.publicUrl)
        toast.success('Фото профиля обновлено')
      } else {
        toast.error(res.error)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        {url ? <AvatarImage src={url} alt="Фото профиля" /> : null}
        <AvatarFallback className="text-lg">{initialsOf(fullName)}</AvatarFallback>
      </Avatar>

      <div>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.08] ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} disabled={uploading} />
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {uploading ? 'Загрузка...' : 'Изменить фото'}
        </label>
        <p className="mt-1.5 text-xs text-muted-foreground">JPEG, PNG, WebP до 5MB</p>
      </div>
    </div>
  )
}
