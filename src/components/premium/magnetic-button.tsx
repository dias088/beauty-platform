'use client'

import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Магнитная CTA-кнопка: слегка тянется за курсором на desktop и
 * возвращается на mouseleave. При prefers-reduced-motion — статична.
 * Может рендериться как ссылка (href) или как обычная кнопка (onClick).
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  type = 'button',
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const handleMove = (e: React.MouseEvent) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    el.style.transform = `translate(${dx * 0.15}px, ${dy * 0.25}px)`
  }

  const handleLeave = () => {
    const el = ref.current
    if (el) el.style.transform = 'translate(0, 0)'
  }

  const classes = cn(
    'btn-primary-glow inline-flex items-center justify-center gap-2 rounded-[14px]',
    'px-6 py-3 text-sm font-semibold tracking-tight will-change-transform',
    'transition-transform duration-200 ease-out',
    className
  )

  if (href) {
    return (
      <Link
        ref={ref as any}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={classes}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      ref={ref as any}
      type={type}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={classes}
    >
      {children}
    </button>
  )
}
