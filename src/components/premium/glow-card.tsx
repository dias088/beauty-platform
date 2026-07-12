'use client'

import { useRef, type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Карточка со стеклянной поверхностью и glow-follow: радиальный свет
 * следует за курсором (только desktop — на touch событий mousemove нет).
 * Координаты пишутся в CSS-переменные --x/--y, сам градиент — в globals.css.
 */
export function GlowCard({
  children,
  className,
  style,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: 'div' | 'article' | 'li'
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  const Comp = Tag as any

  return (
    <Comp
      ref={ref}
      onMouseMove={handleMouseMove}
      style={style}
      className={cn(
        'surface glow-follow rounded-[18px] transition-all duration-200',
        'hover:border-[var(--violet)]/60',
        className
      )}
    >
      {children}
    </Comp>
  )
}
