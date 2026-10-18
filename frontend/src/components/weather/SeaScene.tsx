import { useId } from 'react'
import type { Day, Level, Sky } from '../../lib/weather'

// The sea as it is right now (or at noon on another day): the sky, the sun or moon, clouds, the waves, a bangka
// rocking on them, and a mast with storm-signal flags. More flags means more danger.
type Phase = 'night' | 'dawn' | 'day' | 'dusk'
const phaseOf = (h: number): Phase => (h < 5 || h >= 19 ? 'night' : h < 8 ? 'dawn' : h < 16 ? 'day' : 'dusk')
const SKY: Record<Phase, [string, string, string]> = {
  night: ['#05171e', '#0a2f3c', '#0d525e'],
  dawn: ['#123f52', '#2e8391', '#f2b893'],
  day: ['#1b6f7d', '#5aa3b0', '#e6f4f9'],
  dusk: ['#123f52', '#c95a43', '#f2b893'],
}
const FLAG: Record<Level, { count: number; color: string }> = {
  good: { count: 1, color: 'var(--color-risk-low-line)' },
  caution: { count: 2, color: 'var(--color-risk-moderate-line)' },
  danger: { count: 3, color: 'var(--color-risk-critical-line)' },
}
const CLOUDS: Record<Sky, number> = { sun: 1, partly: 2, cloud: 4, rain: 4 }
const CLOUD_SPOTS: [number, number, number][] = [[60, 52, 1], [170, 34, 0.8], [250, 64, 1.1], [120, 82, 0.7]]

const waves = (amp: number) => {
  let d = 'M-60 0'
  for (let i = 0; i < 9; i++) d += `q15 ${-amp} 30 0t30 0`
  return d
}

type Props = { day: Pick<Day, 'sky' | 'wave' | 'wind'>; hour: number; level: Level }

export default function SeaScene({ day, hour, level }: Props) {
  const uid = useId().replace(/:/g, '')
  const skyId = `sky${uid}`
  const waterId = `water${uid}`
  const phase = phaseOf(hour)
  const [c0, c1, c2] = SKY[phase]
  const amp = Math.min(12, 3 + day.wave * 4)
  const isNight = phase === 'night'
  const p = Math.min(1, Math.max(0, (hour - 6) / 12))
  const sunX = 40 + p * 200
  const sunY = 118 - Math.sin(p * Math.PI) * 78
  const clouds = CLOUD_SPOTS.slice(0, CLOUDS[day.sky])
  const dark = day.sky === 'rain'
  const flag = FLAG[level]
  const rock = Math.min(9, 2 + day.wave * 2.5)
  const ink = isNight ? 'var(--color-cream)' : 'var(--color-deep)' // outlines stay visible at night

  return (
    <svg viewBox="0 0 360 220" className="block w-full" aria-hidden="true">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset=".6" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={waterId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--tide-sea-0)' }} />
          <stop offset=".5" style={{ stopColor: 'var(--tide-sea-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--tide-sea-2)' }} />
        </linearGradient>
      </defs>
      <rect width="360" height="220" fill={`url(#${skyId})`} />

      {/* sun or moon */}
      {isNight ? (
        <g>
          <path d="M210 30A16 16 0 0 0 210 62A24 24 0 0 1 210 30Z" style={{ fill: 'var(--color-ice)' }} />
          {[[150, 30], [110, 56], [260, 24], [290, 70]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.6" fill="#fff" className="anim-twinkle" style={{ animationDelay: `${x % 5}s` }} />)}
        </g>
      ) : (
        <g>
          <circle cx={sunX} cy={sunY} r="30" style={{ fill: 'var(--color-cream)' }} fillOpacity="0.28" />
          <circle cx={sunX} cy={sunY} r="16" style={{ fill: 'var(--color-cream)' }} />
        </g>
      )}

      {/* clouds */}
      {clouds.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} className="anim-cloud" style={{ animationDelay: `${i * 1.3}s` }}>
          <g fill={dark ? '#35525c' : '#fff'} fillOpacity={dark ? 0.95 : 0.88}>
            <circle cx="0" cy="0" r="13" />
            <circle cx="16" cy="-6" r="16" />
            <circle cx="34" cy="0" r="12" />
            <rect x="-12" y="0" width="58" height="12" rx="6" />
          </g>
        </g>
      ))}
      {day.sky === 'rain' && [...Array(14)].map((_, i) => (
        <path key={i} d={`M${24 + i * 24} ${86 + (i % 3) * 8}l-4 14`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
      ))}

      {/* the signal mast: one flag is calm, three is danger */}
      <g>
        <path d="M312 150V50" stroke="var(--color-cream)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="312" cy="48" r="3" style={{ fill: 'var(--color-cream)' }} />
        {Array.from({ length: flag.count }, (_, i) => (
          <g key={i} className="anim-flutter" style={{ transformOrigin: '312px 0', animationDelay: `${i * 0.25}s` }}>
            <path d={`M312 ${58 + i * 18}L344 ${65 + i * 18}L312 ${72 + i * 18}Z`} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" style={{ fill: flag.color }} />
          </g>
        ))}
      </g>

      {/* the sea, and a bangka rocking on it */}
      <rect y="150" width="360" height="70" fill={`url(#${waterId})`} />
      <g className="anim-rock" style={{ transformOrigin: '150px 158px', ['--rock' as string]: `${rock}deg` }}>
        <path d="M118 148C128 160 172 160 182 148Z" stroke={ink} strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--color-coral)' }} />
        <path d="M150 148V116" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M150 116L174 144H150Z" stroke={ink} strokeWidth="2" strokeLinejoin="round" style={{ fill: 'var(--color-cream)' }} />
        <path d="M128 152L112 164M172 152L188 164" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M104 166H122M178 166H196" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <g transform="translate(0 150)"><g className="anim-drift"><path d={waves(amp)} fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="2.2" /></g></g>
      <g transform="translate(0 168)"><g className="anim-drift-rev"><path d={waves(amp * 0.8)} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" /></g></g>
      <g transform="translate(0 190)"><g className="anim-drift"><path d={waves(amp * 0.6)} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" /></g></g>
    </svg>
  )
}