'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Прячет глобальную шапку на страницах, где есть своя навигация:
 * кабинеты (/dashboard/*) и онбординг. На публичных страницах — показывает.
 */
export function HeaderGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hidden = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')
  if (hidden) return null
  return <>{children}</>
}
