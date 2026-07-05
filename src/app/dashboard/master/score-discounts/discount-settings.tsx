'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Sparkles, Info } from 'lucide-react'
import { saveDiscountSettingsAction, type DiscountSettings } from './actions'

const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20] // %

const LEVEL_INFO = {
  verified: {
    emoji: '✅',
    label: 'Проверенный',
    desc: 'Клиенты с 5+ завершёнными записями и хорошей репутацией',
    color: 'bg-amber-100 text-amber-800',
  },
  trusted: {
    emoji: '⭐',
    label: 'Доверенный',
    desc: 'Постоянные клиенты с отличной репутацией, никогда не пропускали',
    color: 'bg-green-100 text-green-800',
  },
}

type Props = {
  initial: DiscountSettings
}

export function DiscountSettingsForm({ initial }: Props) {
  const [verifiedDiscount, setVerifiedDiscount] = useState(initial.verified_discount)
  const [trustedDiscount, setTrustedDiscount]   = useState(initial.trusted_discount)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    // trusted не может быть меньше verified (логически)
    if (trustedDiscount > 0 && verifiedDiscount > 0 && trustedDiscount < verifiedDiscount) {
      toast.error('Скидка для Доверенных не может быть меньше чем для Проверенных')
      return
    }

    setLoading(true)
    const result = await saveDiscountSettingsAction(verifiedDiscount, trustedDiscount)
    setLoading(false)

    if (result.success) {
      toast.success('Настройки сохранены')
    } else {
      toast.error(result.error)
    }
  }

  const hasChanges =
    verifiedDiscount !== initial.verified_discount ||
    trustedDiscount  !== initial.trusted_discount

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-base">Скидки по Beauty Score</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Автоматическая скидка для постоянных и надёжных клиентов.
            Применяется в момент бронирования.
          </p>
        </div>
      </div>

      {/* Пример как это выглядит для клиента */}
      {(verifiedDiscount > 0 || trustedDiscount > 0) && (
        <div className="rounded-lg bg-violet-50 border border-violet-100 p-4 text-sm text-violet-800 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
          <span>
            Клиент увидит скидку при выборе услуги на вашем профиле.
            Цена автоматически пересчитается в момент записи.
          </span>
        </div>
      )}

      <div className="space-y-5">
        {/* Verified */}
        <LevelRow
          level="verified"
          value={verifiedDiscount}
          onChange={setVerifiedDiscount}
        />

        {/* Trusted */}
        <LevelRow
          level="trusted"
          value={trustedDiscount}
          onChange={setTrustedDiscount}
        />
      </div>

      {/* Превью сэкономленной суммы */}
      {(verifiedDiscount > 0 || trustedDiscount > 0) && (
        <ExamplePreview
          verifiedDiscount={verifiedDiscount}
          trustedDiscount={trustedDiscount}
        />
      )}

      <Button
        onClick={handleSave}
        disabled={loading || !hasChanges}
        className="w-full"
      >
        {loading ? 'Сохранение...' : hasChanges ? 'Сохранить' : 'Сохранено'}
      </Button>
    </Card>
  )
}

// ─── Строка уровня ───────────────────────────────────────────────────────────

function LevelRow({
  level,
  value,
  onChange,
}: {
  level: 'verified' | 'trusted'
  value: number
  onChange: (v: number) => void
}) {
  const info = LEVEL_INFO[level]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge className={`${info.color} border-0 text-sm font-medium`}>
          {info.emoji} {info.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{info.desc}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DISCOUNT_OPTIONS.map(pct => (
          <button
            key={pct}
            onClick={() => onChange(pct)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
              value === pct
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-background text-foreground border-border hover:border-violet-300 hover:bg-violet-50',
            ].join(' ')}
          >
            {pct === 0 ? 'Выкл' : `${pct}%`}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Пример расчёта ──────────────────────────────────────────────────────────

function ExamplePreview({
  verifiedDiscount,
  trustedDiscount,
}: {
  verifiedDiscount: number
  trustedDiscount: number
}) {
  const EXAMPLE_PRICE = 8000

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Пример при цене услуги {EXAMPLE_PRICE.toLocaleString('ru')} ₸
      </p>
      <div className="space-y-1.5">
        <PriceRow
          label="🆕 Новый клиент"
          original={EXAMPLE_PRICE}
          discount={0}
        />
        {verifiedDiscount > 0 && (
          <PriceRow
            label="✅ Проверенный"
            original={EXAMPLE_PRICE}
            discount={verifiedDiscount}
          />
        )}
        {trustedDiscount > 0 && (
          <PriceRow
            label="⭐ Доверенный"
            original={EXAMPLE_PRICE}
            discount={trustedDiscount}
          />
        )}
      </div>
    </div>
  )
}

function PriceRow({
  label,
  original,
  discount,
}: {
  label: string
  original: number
  discount: number
}) {
  const final = Math.round(original * (100 - discount) / 100)

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {discount > 0 && (
          <span className="line-through text-muted-foreground text-xs">
            {original.toLocaleString('ru')} ₸
          </span>
        )}
        <span className={discount > 0 ? 'font-semibold text-green-700' : 'font-medium'}>
          {final.toLocaleString('ru')} ₸
        </span>
        {discount > 0 && (
          <Badge className="bg-green-100 text-green-800 border-0 text-xs px-1.5">
            -{discount}%
          </Badge>
        )}
      </div>
    </div>
  )
}
