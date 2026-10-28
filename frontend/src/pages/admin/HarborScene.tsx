import type { CSSProperties } from 'react'

// The harbor at dawn: a pier with the signal mast, bangkas coming home, the sun low on the water.
const WAVES = 'M0 100q15-6 30 0' + 't30 0'.repeat(26)
const rock = (deg: number): CSSProperties => ({ ['--rock' as string]: `${deg}deg`, transformBox: 'fill-box', transformOrigin: 'center bottom' })

function Bangka({ x, y, scale = 1, deg = 3 }: { x: number; y: number; scale?: number; deg?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="anim-rock" style={rock(deg)}>
        <path d="M-22 0C-12 8 12 8 22 0Z" style={{ fill: 'var(--color-cream)' }} stroke="var(--color-deep)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M0 0V-24" stroke="var(--color-deep)" strokeWidth="2" strokeLinecap="round" />
        <path d="M0 -24L15 -4H0Z" style={{ fill: 'var(--color-coral)' }} stroke="var(--color-deep)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-12 2L-20 9M12 2L20 9" stroke="var(--color-deep)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  )
}

export default function HarborScene() {
  const flag = (d: string, fill: string, delay: string) => (
    <g className="anim-flutter" style={{ transformOrigin: '548px 40px', animationDelay: delay }}>
      <path d={d} style={{ fill }} stroke="var(--color-deep)" strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  )
  return (
    <svg viewBox="0 0 720 120" preserveAspectRatio="xMaxYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full sm:h-40" aria-hidden="true">
      <defs>
        <radialGradient id="harbor-glow">
          <stop offset="0" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0.85" />
          <stop offset="1" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="628" cy="66" r="42" fill="url(#harbor-glow)" className="anim-glow" />
      <circle cx="628" cy="66" r="15" style={{ fill: 'var(--color-cream)' }} />

      <rect y="84" width="720" height="36" style={{ fill: 'var(--tide-sea-1)' }} fillOpacity="0.92" />

      <Bangka x={120} y={88} scale={0.9} deg={3} />
      <Bangka x={290} y={92} scale={1.15} deg={4} />
      <Bangka x={430} y={89} scale={0.8} deg={3} />

      <rect x="486" y="82" width="140" height="5" rx="2" style={{ fill: 'var(--color-deep)' }} />
      <path d="M494 87V110M522 87V110M550 87V110M578 87V110M606 87V110" stroke="var(--color-deep)" strokeWidth="3" strokeLinecap="round" />
      <path d="M548 82V30" stroke="var(--color-deep)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M542 36H554" stroke="var(--color-deep)" strokeWidth="2" strokeLinecap="round" />
      {flag('M548 40L572 44.5L548 49Z', 'var(--color-coral)', '0s')}
      {flag('M548 53L568 57L548 61Z', 'var(--color-cream)', '0.4s')}
      {flag('M548 65L563 68L548 71Z', 'var(--color-peach)', '0.8s')}

      <g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" /></g>
      <g className="anim-drift-rev" transform="translate(0 9)"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" /></g>
    </svg>
  )
}