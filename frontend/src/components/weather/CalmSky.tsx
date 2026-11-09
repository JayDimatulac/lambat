import { useId } from 'react'
import type { Day } from '../../lib/weather'

// A soft, quiet picture of the sea: one sky, the sun or moon, a few clouds, gentle waves and a small bangka.
// No signal flags and no numbers. The words and numbers sit on top of it in the page.
type Phase = 'night' | 'dawn' | 'day' | 'dusk'
const phaseOf = (h: number): Phase => (h < 5 || h >= 19 ? 'night' : h < 8 ? 'dawn' : h < 16 ? 'day' : 'dusk')

const SKY: Record<Phase, [string, string, string]> = {
  night: ['#0b2a3a', '#12465a', '#1d6a7a'],
  dawn: ['#9ccfe0', '#f6d2b8', '#fde7d0'],
  day: ['#7fcde0', '#d6eff1', '#fde3c8'],
  dusk: ['#3f5f7f', '#c98a8a', '#fbd9b8'],
}
const SEA: Record<Phase, [string, string]> = {
  night: ['#12465a', '#0a2f3c'],
  dawn: ['#4aa3b1', '#1c6c7b'],
  day: ['#4aa3b1', '#1c6c7b'],
  dusk: ['#2b6f85', '#123f52'],
}

const CLOUD_SPOTS: [number, number, number][] = [[300, 66, 0.9], [215, 36, 1], [130, 28, 0.7], [335, 30, 0.7], [250, 84, 0.8]]
const CLOUD_COUNT = { sun: 1, partly: 3, cloud: 5, rain: 5 }

const waves = (amp: number) => {
  let d = 'M-60 0'
  for (let i = 0; i < 9; i++) d += `q15 ${-amp} 30 0t30 0`
  return d
}

export default function CalmSky({ day, hour }: { day: Pick<Day, 'sky' | 'wave'>; hour: number }) {
  const uid = useId().replace(/:/g, '')
  const skyId = `calmsky${uid}`
  const seaId = `calmsea${uid}`
  const phase = phaseOf(hour)
  const night = phase === 'night'
  const [c0, c1, c2] = SKY[phase]
  const [s0, s1] = SEA[phase]
  const p = Math.min(1, Math.max(0, (hour - 6) / 12))
  const sunX = 190 + p * 130
  const sunY = 112 - Math.sin(p * Math.PI) * 66
  const low = p < 0.15 || p > 0.85
  const clouds = CLOUD_SPOTS.slice(0, CLOUD_COUNT[day.sky])
  const rain = day.sky === 'rain'
  const amp = Math.min(9, 2.5 + day.wave * 3)
  const rock = Math.min(5, 1.5 + day.wave * 1.5)

  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="0.6" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={seaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s0} />
          <stop offset="1" stopColor={s1} />
        </linearGradient>
      </defs>
      <rect width="360" height="200" fill={`url(#${skyId})`} />

      {night ? (
        <g>
          <path d="M270 26A16 16 0 0 0 270 58A24 24 0 0 1 270 26Z" style={{ fill: 'var(--color-ice)' }} />
          {[[200, 30], [160, 62], [320, 24], [340, 80], [230, 78]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" className="anim-twinkle" style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
      ) : (
        <g>
          <circle cx={sunX} cy={sunY} r="38" fill="#ffe9b8" fillOpacity="0.4" className="anim-glow" />
          <circle cx={sunX} cy={sunY} r="17" fill={low ? '#f6a77f' : '#ffd98a'} />
        </g>
      )}

      {clouds.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <g className="anim-cloud" style={{ animationDelay: `${i * -1.7}s` }} fill={night ? '#35525c' : rain ? '#b7c7ce' : '#fff'} fillOpacity={night ? 0.55 : 0.92}>
            <circle cx="0" cy="0" r="13" />
            <circle cx="16" cy="-6" r="16" />
            <circle cx="34" cy="0" r="12" />
            <rect x="-12" y="0" width="58" height="12" rx="6" />
          </g>
        </g>
      ))}
      {rain && [...Array(12)].map((_, i) => (
        <path key={i} d={`M${150 + i * 18} ${88 + (i % 3) * 8}l-3 12`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
      ))}

      <rect y="140" width="360" height="60" fill={`url(#${seaId})`} />
      <g className="anim-rock" style={{ transformOrigin: '215px 148px', ['--rock' as string]: `${rock}deg` }}>
        <path d="M195 140C203 150 227 150 235 140Z" style={{ fill: 'var(--color-coral)' }} />
        <path d="M215 140V114" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
        <path d="M215 114L231 136H215Z" fill="#fff" fillOpacity="0.95" />
      </g>
      <g transform="translate(0 140)"><g className="anim-drift"><path d={waves(amp)} fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" /></g></g>
      <g transform="translate(0 160)"><g className="anim-drift-rev"><path d={waves(amp * 0.8)} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" /></g></g>
      <g transform="translate(0 182)"><g className="anim-drift"><path d={waves(amp * 0.6)} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" /></g></g>
    </svg>
  )
}