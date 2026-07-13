/**
 * Scroll-driven («scrollytelling») атмосферный фон лендинга — на чистом CSS
 * (scroll-timeline, см. globals.css). По мере прокрутки:
 *  - орбы уходят параллаксом на разной скорости;
 *  - центральное свечение перетекает по бьюти-палитре
 *    (фиолетовый → маджента → индиго) и меняет положение;
 *  - нижний орб проявляется к концу страницы.
 * Фиксирован к вьюпорту, контент скроллит поверх. Привязка к скроллу —
 * на уровне композитора (без JS/rAF), поэтому плавно и дёшево.
 * При prefers-reduced-motion параллакс отключается, перелив цвета остаётся.
 * На браузерах без scroll-timeline — статичный премиум-фон.
 */
export function ScrollBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="grid-overlay" />

      {/* Перетекающее центральное свечение */}
      <div className="scroll-glow absolute inset-0" />

      {/* Орбы с параллаксом */}
      <div
        className="orb parallax-slow"
        style={{ top: '-150px', right: '-110px', width: 460, height: 460, background: 'var(--orb-1)' }}
      />
      <div
        className="orb parallax-rev"
        style={{ top: '28%', left: '-170px', width: 400, height: 400, background: 'var(--orb-2)' }}
      />
      <div
        className="orb orb3-scroll"
        style={{ bottom: '-170px', left: '38%', width: 380, height: 380, background: 'var(--orb-3)', opacity: 0 }}
      />
    </div>
  )
}
