'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
          <p className="text-muted-foreground mt-2">
            Мы уже работаем над исправлением этой проблемы
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            Попробовать снова
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { window.location.href = '/' }}
          >
            На главную
          </Button>
        </div>
      </div>
    </main>
  )
}
