import { getDiscountSettingsAction } from './actions'
import { DiscountSettingsForm } from './discount-settings'

export default async function ScoreDiscountsPage() {
  const settings = await getDiscountSettingsAction()

  return (
    <main className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Beauty Score — скидки</h1>
        <p className="text-muted-foreground mt-2">
          Настройте автоматические скидки для клиентов с высоким Beauty Score.
          Скидки применяются в момент бронирования.
        </p>
      </div>

      <DiscountSettingsForm initial={settings} />
    </main>
  )
}
