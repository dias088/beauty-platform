'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { logoutAction } from '@/app/(auth)/actions'
import { Calendar, Home, Settings, LogOut, Menu, Wrench, BarChart3, ExternalLink, Copy, Check, Zap, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'

const MENU_ITEMS = [
  { href: '/dashboard/master', icon: Home, label: 'Записи' },
  { href: '/dashboard/master/schedule', icon: Calendar, label: 'Расписание' },
  { href: '/dashboard/master/services', icon: Wrench, label: 'Услуги' },
  { href: '/dashboard/master/profile', icon: Settings, label: 'Профиль' },
  { href: '/dashboard/master/stats', icon: BarChart3, label: 'Статистика' },
  { href: '/dashboard/master/crm', icon: Users, label: 'Клиенты' },
  { href: '/dashboard/master/boost', icon: Zap, label: 'Буст', highlight: true },
  { href: '/dashboard/master/score-discounts', icon: Sparkles, label: 'Скидки Beauty Score' },
]

function ProfileLink({ masterId }: { masterId?: string }) {
  const [copied, setCopied] = useState(false)

  if (!masterId) return null

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/masters/${masterId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast.success('Ссылка скопирована!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  return (
    <div className="px-4 pb-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Моя страница</p>
      <div className="flex gap-1">
        <Link
          href={`/masters/${masterId}`}
          target="_blank"
          className="flex-1 flex items-center gap-2 px-3 py-2 text-xs rounded-md border hover:bg-accent transition-colors truncate"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">Открыть профиль</span>
        </Link>
        <button
          onClick={handleCopy}
          title="Скопировать ссылку для Instagram"
          className="px-2 py-2 rounded-md border hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Скопируй ссылку → вставь в шапку Instagram</p>
    </div>
  )
}

function SidebarContent({ masterId }: { masterId?: string }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-lg tracking-tight">
            Beauty
            <span className="text-primary">.</span>kz
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Кабинет мастера</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {MENU_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${item.highlight && pathname !== item.href ? 'text-[#fbbf24] hover:text-[#fcd34d]' : ''}`}
              >
                <Icon className="w-4 h-4 mr-2 shrink-0" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <ProfileLink masterId={masterId} />

      <div className="p-4 border-t">
        <form action={logoutAction}>
          <Button variant="outline" className="w-full justify-start text-sm" type="submit">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </form>
      </div>
    </div>
  )
}

export function MasterSidebar({ masterId }: { masterId?: string }) {
  return (
    <>
      {/* Desktop сайдбар */}
      <aside className="hidden md:flex w-64 border-r bg-background flex-col shrink-0">
        <SidebarContent masterId={masterId} />
      </aside>

      {/* Mobile гамбургер */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
            }
          />
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent masterId={masterId} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
