'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Счётчик: число отсчитывается с ease-out за ~1.6s, когда попадает
 * в viewport (IntersectionObserver). Формат — ru-RU (пробелы в тысячах).
 * При prefers-reduced-motion сразу показывает финальное значение.
 */
export function AnimatedCounter({
  value,
  duration = 1600,
  suffix = '',
  prefix = '',
  className = '',
}: {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
            setDisplay(Math.round(value * eased))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString('ru-RU')}
      {suffix}
    </span>
  )
}
