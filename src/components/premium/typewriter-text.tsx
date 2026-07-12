'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Печатает фразы по буквам, затем стирает и переходит к следующей.
 * Без мигающего курсора (по требованию дизайна). При prefers-reduced-motion
 * просто показывает первую фразу статично.
 */
export function TypewriterText({
  phrases,
  className = '',
  typingSpeed = 55,
  deletingSpeed = 30,
  pause = 1400,
}: {
  phrases: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pause?: number
}) {
  const reduce = useReducedMotion()
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduce) {
      setText(phrases[0] ?? '')
      return
    }
    const current = phrases[index % phrases.length]

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setIndex(i => i + 1)
      return
    }

    const t = setTimeout(
      () => {
        setText(prev =>
          deleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1)
        )
      },
      deleting ? deletingSpeed : typingSpeed
    )
    return () => clearTimeout(t)
  }, [text, deleting, index, phrases, typingSpeed, deletingSpeed, pause, reduce])

  return (
    <span className={className} aria-live="polite">
      {text || ' '}
    </span>
  )
}
