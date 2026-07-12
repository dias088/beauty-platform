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
          top: '-140px',
          right: '-100px',
          width: '540px',
          height: '540px',
          background: 'var(--orb-1)',
          animation: 'drift 16s ease-in-out infinite',
        }}
      />
      {variant === 'full' && (
        <>
          <div
            className="orb"
            style={{
              top: '80px',
              left: '-160px',
              width: '460px',
              height: '460px',
              background: 'var(--orb-2)',
              animation: 'driftAlt 19s ease-in-out infinite',
            }}
          />
          <div
            className="orb"
            style={{
              bottom: '-180px',
              left: '30%',
              width: '420px',
              height: '420px',
              background: 'var(--orb-3)',
              opacity: 0.28,
              animation: 'drift 22s ease-in-out infinite',
            }}
          />
        </>
      )}
    </div>
  )
}
