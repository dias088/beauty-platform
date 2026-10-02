import Link from 'next/link'
import { getMyProStatus } from '@/lib/queries/subscription'
import { isProUntil } from '@/lib/billing/pro'
import { isCheckoutEnabled } from '@/lib/billing/provider'
import { ProCheckoutButton } from './_components/pro-checkout-button'
import { CancelSubscriptionButton } from './_components/cancel-subscription-button'
import { PRO_PRICE_KZT } from '@/lib/billing/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
  active: { label: 'Активна', variant: 'default' },
  past_due: { label: 'Ожидает оплаты', variant: 'destructive' },
  canceled: { label: 'Отменена', variant: 'outline' },
  expired: { label: 'Истекла', variant: 'outline' },
  inactive: { label: 'Не оформлена', variant: 'outline' },
}

const PERKS = [
  { icon: Zap, text: 'Буст профиля — выше в каталоге' },
  { icon: BarChart3, text: 'Полная статистика и аналитика' },
  { icon: Sparkles, text: 'Значок TOP на карточке и в профиле' },
]

export default async function SubscriptionPage() {
  const my = await getMyProStatus()
  const sub = my?.subscription ?? null
  const proUntil = my?.proUntil ?? null
  const pro = isProUntil(proUntil)
  const status = STATUS_LABEL[sub?.status ?? 'inactive'] ?? STATUS_LABEL.inactive
  // Автосписание идёт, пока подписка active/past_due; canceled — уже отключено.
  const autopay = sub?.status === 'active' || sub?.status === 'past_due'
  const checkoutEnabled = isCheckoutEnabled()
  const price = PRO_PRICE_KZT.toLocaleString('ru')

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Подписка Pro</h1>
      <p className="text-muted-foreground mb-8">
        {PRO_PRICE_KZT.toLocaleString('ru')} ₸ в месяц — буст, статистика и значок Pro.
      </p>

      {/* Текущий статус */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Статус</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-semibold">{pro ? 'Pro активен' : 'Бесплатный тариф'}</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
          {sub?.card_last4 && (
            <div className="text-right text-sm text-muted-foreground">
              Карта •• {sub.card_last4}
            </div>
          )}
        </div>

        {pro && proUntil && (
          <p className="mt-4 text-sm text-muted-foreground">
            Pro действует до:{' '}
            <span className="font-medium text-foreground">
              {format(new Date(proUntil), 'd MMMM yyyy', { locale: ru })}
            </span>
          </p>
        )}
        {sub?.status === 'active' && sub.current_period_end && (
          <p className="mt-1 text-sm text-muted-foreground">
            Следующее списание:{' '}
            <span className="font-medium text-foreground">
              {format(new Date(sub.current_period_end), 'd MMMM yyyy', { locale: ru })}
            </span>
          </p>
        )}
      </Card>

      {/* Что входит */}
      <Card className="p-6 mb-6">
        <div className="font-semibold mb-4">Что входит в Pro</div>
        <ul className="space-y-3">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,45,120,0.12)]">
                <Icon className="h-4 w-4 text-[var(--violet-bright)]" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </Card>

      {/* CTA */}
      {autopay ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-green-500">
            <Check className="h-5 w-5" />
            <span className="font-medium">Автосписание включено, все функции Pro доступны.</span>
          </div>
          {sub?.status === 'past_due' && (
            <p className="mt-3 text-sm text-red-400">
              Последнее списание не прошло. Проверьте, что на карте есть деньги: мы попробуем ещё раз.
            </p>
          )}
          <CancelSubscriptionButton />
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="font-semibold text-lg">
            {pro ? 'Включить автопродление Pro' : `Оформить Pro за ${price} ₸/мес`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Оплата картой любого банка, Apple Pay или Google Pay. Списание раз в месяц, отмена в любой момент.
          </p>
          {checkoutEnabled ? (
            <ProCheckoutButton priceLabel={price} />
          ) : (
            <>
              <button
                disabled
                className="btn-primary-glow mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-white opacity-60"
              >
                Скоро — подключаем оплату
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                Пока автосписание не подключено, Pro можно оплатить разово на 7 или 30 дней.
              </p>
              <Link
                href="/dashboard/master/boost"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 py-3 text-sm font-semibold hover:bg-white/[0.04]"
              >
                Оплатить Pro разово
              </Link>
            </>
          )}
        </Card>
      )}
    </main>
  )
}
