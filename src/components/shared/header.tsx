import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LogoutButton from './logout-button'
import { cn } from '@/lib/utils'
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1 group">
      <span className="font-medium text-base tracking-tight text-foreground">
        Beauty<span className="text-violet-600">.</span>kz
      </span>
    </Link>
  )
}

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto flex justify-between items-center h-14 px-6 max-w-5xl">
          <Logo />
          <nav className="flex items-center gap-1">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-sm')}
            >
              Войти
            </Link>
            <Link
              href="/register?role=master"
              className={cn(buttonVariants({ size: 'sm' }), 'bg-violet-600 hover:bg-violet-700 text-sm')}
            >
              Начать бесплатно
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const dashboardHref = profile?.role === 'master' ? '/dashboard/master' : '/dashboard/client'
  const dashboardLabel = profile?.role === 'master' ? 'Кабинет мастера' : 'Мой кабинет'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex justify-between items-center h-14 px-6 max-w-5xl">
        <Logo />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors outline-none">
            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-32 truncate">
              {profile?.full_name || user.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={dashboardHref} className="flex items-center gap-2 w-full">
                <LayoutDashboard className="w-4 h-4" />
                {dashboardLabel}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <div className="flex items-center gap-2 w-full">
                <LogOut className="w-4 h-4" />
                <LogoutButton />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
