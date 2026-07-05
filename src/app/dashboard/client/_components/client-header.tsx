import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LogoutButton from '@/components/shared/logout-button'
import { ChevronDown, LogOut } from 'lucide-react'
import { ClientNav } from './client-nav'

export async function ClientHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">💄</span>
          <span className="font-bold text-lg tracking-tight">
            Beauty<span className="text-primary">.</span>
          </span>
        </Link>

        <ClientNav />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted transition-colors outline-none">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-32 truncate">
              {profile?.full_name || user?.email}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
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
