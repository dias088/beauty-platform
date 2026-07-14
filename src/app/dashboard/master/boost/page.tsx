'use client'

import { useState } from 'react'
import { requestBoostAction } from '../actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Zap, Check, Copy, TrendingUp, Eye, Star } from 'lucide-react'

const PLANS = [
  {
    id: '7d' as const,
    label: '7 дней',
    price: 2990,
    badge: null,
    features: ['TOP-позиция в выдаче', 'Значок TOP на карточке', '3–5× просмотров профиля'],
  },
  {
    id: '30d' as const,
    label: '30 дней',
    price: 7990,
    badge: 'Выгоднее',
    features: ['TOP-позиция в выдаче', 'Значок TOP на карточке', '3–5× просмотров профиля', 'Экономия 3 940 ₸ vs 4 недели'],
  },
]

type PaymentState = { kaspi_number: string; amount: number } | null

export default function BoostPage() {
  const [loading, setLoading] = useState<'7d' | '30d' | null>(null)
  const [payment, setPayment] = useState<PaymentState>(null)
  const [copied, setCopied] = useState(false)

  const handleRequest = async (plan: '7d' | '30d') => {
    setLoading(plan)
    const result = await requestBoostAction(plan)
    setLoading(null)

    if (result.success) {
      setPayment(result.data!)
    } else {
      toast.error(result.error)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Скопировано!')
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="w-8 h-8 text-amber-500" />
          Буст профиля
        </h1>
        <p className="text-muted-foreground mt-2">
          Выйди на первые позиции в поиске и получи в 3–5 раз больше просмотров
        </p>
      </div>

      {/* Что даёт буст */}
      <Card className="p-6 mb-8 bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.22)]">
        <h2 className="font-semibold text-[#fcd34d] mb-4">Что даёт буст?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, title: 'TOP в выдаче', desc: 'Твой профиль первым видят все клиенты' },
            { icon: Eye, title: 'Больше просмотров', desc: 'В среднем ×3–5 к органическому трафику' },
            { icon: Star, title: 'Значок TOP', desc: 'Выделяешься среди других мастеров' },
          ].map(item => (
            <div key={item.title} className="flex gap-3">
              <item.icon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#fcd34d] text-sm">{item.title}</p>
                <p className="text-xs text-[#fbbf24] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Тарифы */}
      {!payment && (
        <>
          <h2 className="text-xl font-bold mb-4">Выбери тариф</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 mt-3">
            {PLANS.map(plan => (
              <Card
                key={plan.id}
                className={`p-6 relative overflow-visible ${plan.badge ? 'border-amber-400 shadow-md' : ''}`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#451a03] border-0">
                    {plan.badge}
                  </Badge>
                )}
                <div className="mb-4">
                  <p className="text-lg font-bold">{plan.label}</p>
                  <p className="text-3xl font-bold mt-1">
                    {plan.price.toLocaleString('ru')} ₸
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ {Math.round(plan.price / parseInt(plan.id)).toLocaleString('ru')} ₸/день
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.badge ? 'default' : 'outline'}
                  onClick={() => handleRequest(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? 'Оформление...' : 'Купить буст'}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Инструкция по оплате */}
      {payment && (
        <Card className="p-6 border-[rgba(16,185,129,0.22)] bg-[rgba(16,185,129,0.08)]">
          <h2 className="text-xl font-bold text-[#6ee7b7] mb-2">
            Заявка принята!
          </h2>
          <p className="text-[#34d399] text-sm mb-6">
            Переведи оплату через Kaspi — мы активируем буст в течение 1 часа.
          </p>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">Номер Kaspi для перевода</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-mono font-bold">{payment.kaspi_number}</p>
                <button
                  onClick={() => handleCopy(payment.kaspi_number)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">Сумма перевода</p>
              <p className="text-xl font-bold">{payment.amount.toLocaleString('ru')} ₸</p>
            </div>

            <p className="text-xs text-[#34d399]">
              После перевода напиши нам в WhatsApp или Telegram — мы активируем буст немедленно.
              Буст начнёт работать через несколько минут после подтверждения оплаты.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPayment(null)}
            >
              Выбрать другой тариф
            </Button>
          </div>
        </Card>
      )}
    </main>
  )
}
