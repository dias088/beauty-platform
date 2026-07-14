/**
 * Тихий статичный атмосферный фон лендинга: пара очень слабых размытых
 * пятен + тонкая сетка. Без параллакса и scroll-timeline — ничего не
 * «телепортируется» при прокрутке. Фиксирован к вьюпорту, контент скроллит поверх.
 */
export function ScrollBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="grid-overlay opacity-50" />
      <div
        className="orb"
        style={{ top: '-180px', right: '-140px', width: 460, height: 460, background: 'var(--orb-1)', opacity: 0.07 }}
      />
      <div
        className="orb"
        style={{ bottom: '-200px', left: '-140px', width: 420, height: 420, background: 'var(--orb-3)', opacity: 0.05 }}
      />
    </div>
  )
}
