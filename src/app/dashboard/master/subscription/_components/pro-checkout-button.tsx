'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CheckoutIntent } from '@/lib/billing/types'
import { startProCheckoutAction } from '../actions'

type WidgetResult = { type?: string; status?: string }
type TiptopGlobal = { Widget: new () => { start(params: Record<string, unknown>): Promise<WidgetResult> } }

declare global {
  interface Window { tiptop?: TiptopGlobal }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('script load failed'))
    document.head.appendChild(s)
  })
}

/** Открывает платёжную форму провайдера; true — оплата прошла. */
async function openCheckout(intent: CheckoutIntent): Promise<boolean> {
  await loadScript(intent.scriptUrl)
  if (intent.provider === 'tiptoppay' && window.tiptop) {
    const result = await new window.tiptop.Widget().start(intent.params)
    return result?.type === 'payment' && result?.status === 'success'
  }
  throw new Error(`unsupported provider ${intent.provider}`)
}

export function ProCheckoutButton({ priceLabel }: { priceLabel: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await startProCheckoutAction()
      if (!res.success) {
        toast.error(res.error)
        return
      }
      const paid = await openCheckout(res.data)
      if (paid) {
        toast.success('Оплата прошла. Pro включится в течение минуты.')
        // Pro включает webhook провайдера, даём ему немного времени.
        setTimeout(() => router.refresh(), 5000)
      }
    } catch (e) {
      console.error(e)
      toast.error('Не удалось открыть оплату, попробуйте ещё раз')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary-glow mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? 'Открываем оплату…' : `Оформить за ${priceLabel} ₸/мес`}
    </button>
  )
}
