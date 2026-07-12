import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Header } from '@/components/shared/header'
import './globals.css'
import { cn } from "@/lib/utils";

// Inter supports Cyrillic, which this Russian-language site requires.
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: {
    default: 'Beauty Platform — Записи к мастерам красоты в Астане',
    template: '%s | Beauty Platform',
  },
  description: 'Запишись к лучшим мастерам красоты в Астане онлайн: маникюр, педикюр, ресницы, брови, макияж, косметология. Beauty Score — репутационная система клиентов.',
  keywords: ['мастер красоты', 'Астана', 'маникюр', 'ресницы', 'брови', 'макияж', 'запись онлайн', 'beauty'],
  authors: [{ name: 'Beauty Platform' }],
  metadataBase: new URL('https://beauty-platform.kz'),
  openGraph: {
    title: 'Beauty Platform — Мастера красоты в Астане',
    description: 'Запишись к проверенным мастерам красоты онлайн. Beauty Score — рейтинг надёжности клиентов.',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://beauty-platform.kz',
    siteName: 'Beauty Platform',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Beauty Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beauty Platform — Мастера красоты в Астане',
    description: 'Запишись к мастерам красоты онлайн',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={cn("dark font-sans", inter.variable)}>
      <body className="font-sans antialiased bg-background text-foreground">
        <Header />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
