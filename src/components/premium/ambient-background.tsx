/**
 * Атмосферный фон публичных страниц: дрейфующие орбы + тонкая сетка.
 * Чистый CSS (без JS) — можно использовать в серверных компонентах.
 * На мобильных орбы уменьшаются (см. .orb в globals.css), анимации
 * отключаются при prefers-reduced-motion.
 */
export function AmbientBackground({
  variant = 'full',
  className = '',
}: {
  /** 'full' — три орба (лендинг), 'quiet' — один едва заметный (дашборд) */
  variant?: 'full' | 'quiet'
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="grid-overlay" />

      <div
        className="orb"
        style={{
          top: '-160px',
          right: '-120px',
          width: '460px',
          height: '460px',
          background: 'var(--orb-1)',
          animation: 'drift 18s ease-in-out infinite',
        }}
      />
      {variant === 'full' && (
        <>
          <div
            className="orb"
            style={{
              top: '120px',
              left: '-180px',
              width: '400px',
              height: '400px',
              background: 'var(--orb-2)',
              opacity: 0.16,
              animation: 'driftAlt 21s ease-in-out infinite',
            }}
          />
          <div
            className="orb"
            style={{
              bottom: '-200px',
              left: '35%',
              width: '380px',
              height: '380px',
              background: 'var(--orb-3)',
              opacity: 0.14,
              animation: 'drift 24s ease-in-out infinite',
            }}
          />
        </>
      )}
    </div>
  )
}
