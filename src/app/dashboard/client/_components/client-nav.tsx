'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard/client', label: 'Записи' },
  { href: '/dashboard/client/favorites', label: 'Избранные' },
  { href: '/dashboard/client/beauty-score', label: 'Beauty Score' },
  { href: '/dashboard/client/profile', label: 'Профиль' },
]

export function ClientNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {NAV.map(({ href, label }) => {
        const isActive =
          href === '/dashboard/client'
            ? pathname === href
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
