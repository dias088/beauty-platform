import { PortfolioManager } from './_components/portfolio-manager'

export default function PortfolioPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Мои работы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Фото портфолио — их видят клиенты в каталоге и в вашем профиле.
        </p>
      </div>
      <PortfolioManager />
    </main>
  )
}
