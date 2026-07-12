import type { CSSProperties, ReactNode } from 'react'

/**
 * Мягкое появление секции при прокрутке. Реализовано на чистом CSS
 * (класс .reveal со scroll-driven animation, см. globals.css) — без JS
 * и без motion, поэтому нет рассинхронизации гидрации между SSR и клиентом.
 * В браузерах без scroll-timeline контент просто виден. prefers-reduced-motion
 * отключает анимацию (см. globals.css).
 */
export function SectionReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const style: CSSProperties | undefined =
    delay > 0 ? { animationDelay: `${delay}s` } : undefined

  return (
    <div className={`reveal ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}
