'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cancelProSubscriptionAction } from '../actions'

export function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    const res = await cancelProSubscriptionAction()
    setLoading(false)
    setConfirming(false)
    if (res.success) toast.success('Автосписание отключено. Pro действует до конца оплаченного периода.')
    else toast.error(res.error)
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Отменить подписку
      </button>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      <span className="text-muted-foreground">Отключить автосписание?</span>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-red-400 hover:bg-red-500/10 disabled:opacity-60"
      >
        {loading ? 'Отменяем…' : 'Да, отменить'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-muted-foreground hover:text-foreground">
        Оставить
      </button>
    </div>
  )
}
