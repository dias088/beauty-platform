import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <p className="text-8xl font-bold text-muted-foreground/30">404</p>
          <h1 className="text-2xl font-bold mt-2">Страница не найдена</h1>
          <p className="text-muted-foreground mt-2">
            Похоже, эта страница была удалена или переименована
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </main>
  )
}
