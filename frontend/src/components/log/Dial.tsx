// A weighing dial: the needle swings as the kilos change. 0 to 100 kg, then it stays at the end.
const MAX = 100
const TICKS = [0, 25, 50, 75, 100]

const point = (value: number, r: number) => {
  const angle = Math.PI * (1 - value / MAX)
  return [120 + r * Math.cos(angle), 120 - r * Math.sin(angle)]
}

export default function Dial({ kg }: { kg: number }) {
  const shown = Math.min(kg, MAX)
  return (
    <svg viewBox="0 0 240 140" className="mx-auto w-full max-w-xs" aria-hidden="true">
      <path d="M20 120A100 100 0 0 1 220 120" fill="none" strokeWidth="16" strokeLinecap="round" style={{ stroke: 'var(--color-line)' }} />
      <path
        d="M20 120A100 100 0 0 1 220 120"
        fill="none"
        strokeWidth="16"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${shown} 100`}
        style={{ stroke: 'var(--color-teal)', transition: 'stroke-dasharray 0.5s ease' }}
      />
      {TICKS.map((v) => {
        const [x1, y1] = point(v, 90)
        const [x2, y2] = point(v, 78)
        const [tx, ty] = point(v, 54)
        return (
          <g key={v}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.5" strokeLinecap="round" style={{ stroke: 'var(--color-ink-soft)' }} />
            <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12" fontWeight="600" style={{ fill: 'var(--color-ink-soft)' }}>
              {v === 100 ? '100+' : v}
            </text>
          </g>
        )
      })}
      <g style={{ transform: `rotate(${-90 + (shown / MAX) * 180}deg)`, transformOrigin: '120px 120px', transition: 'transform 0.5s cubic-bezier(0.3, 1.4, 0.5, 1)' }}>
        <path d="M120 120V40" strokeWidth="4" strokeLinecap="round" style={{ stroke: 'var(--color-deep)' }} />
        <path d="M113 50L120 30L127 50Z" strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--color-coral)', stroke: 'var(--color-deep)' }} />
      </g>
      <circle cx="120" cy="120" r="9" style={{ fill: 'var(--color-deep)' }} />
    </svg>
  )
}