import { FISH } from '../home/HomeIcons'

// A drying rack with five fish hung on it. Every dry, golden fish is one point for drying that day.
export default function DryRack({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 220 : 76
  return (
    <svg viewBox="0 0 90 56" width={w} height={(w * 56) / 90} aria-hidden="true">
      <path d="M6 54L14 6M84 54L76 6" stroke="var(--color-ink-soft)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 8H80" stroke="var(--color-ink-soft)" strokeWidth="2.6" strokeLinecap="round" />
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < score
        const x = 18 + i * 13.5
        return (
          <g key={i}>
            <path d={`M${x} 9V13`} stroke="var(--color-ink-soft)" strokeWidth="1.4" strokeLinecap="round" />
            <g transform={`translate(${x} 22) rotate(90) scale(0.62) translate(-13 -18)`}>
              <path
                d={FISH}
                strokeWidth={on ? 2.2 : 2}
                strokeLinejoin="round"
                strokeDasharray={on ? undefined : '4 4'}
                style={{ fill: on ? 'var(--color-peach)' : 'transparent', stroke: on ? 'var(--color-deep)' : 'var(--color-ink-soft)', strokeOpacity: on ? 1 : 0.7 }}
              />
            </g>
          </g>
        )
      })}
    </svg>
  )
}