import { useId } from 'react'
import type { Sky } from '../../lib/weather'

type Props = { day: { sky: Sky }; hour: number; night?: boolean }

const HORIZON = 250

// a row of gentle waves, repeated across the width
const wave = (y: number, amp: number) =>
  `M-100 ${y} ` + Array.from({ length: 13 }, (_, i) => (i === 0 ? `q 50 ${-amp} 100 0` : 't 100 0')).join(' ')

export default function CalmSky({ day, hour, night }: Props) {
  const id = useId().replace(/:/g, '')
  const dark = night ?? (hour < 5 || hour >= 16)
  const cloudy = day.sky === 'cloud' || day.sky === 'rain'
  const showCloud = day.sky !== 'sun'

  const c = dark
    ? {
        skyTop: '#07142b',
        skyBot: '#1c3a5e',
        seaTop: '#1a4a5e',
        seaBot: '#0a2230',
        wave: 'rgba(255,255,255,0.14)',
        halo: 'rgba(200,215,255,0.10)',
        body: '#f4f0d8',
        cloud: cloudy ? '#3b4d66' : '#4a5d78',
        sail: '#e9eef5',
        hull: '#c9604f',
      }
    : {
        skyTop: cloudy ? '#9fb7c4' : '#a9dbe8',
        skyBot: cloudy ? '#d3dfe3' : '#e3efe6',
        seaTop: '#4aa3b3',
        seaBot: '#256e80',
        wave: 'rgba(255,255,255,0.35)',
        halo: 'rgba(255,224,150,0.35)',
        body: '#ffd98a',
        cloud: cloudy ? '#e8eef0' : '#ffffff',
        sail: '#ffffff',
        hull: '#e8705b',
      }

  return (
    <svg
      viewBox="0 0 1000 400"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.skyTop} />
          <stop offset="1" stopColor={c.skyBot} />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.seaTop} />
          <stop offset="1" stopColor={c.seaBot} />
        </linearGradient>
      </defs>

      {/* sky and sea */}
      <rect width="1000" height={HORIZON} fill={`url(#${id}-sky)`} />
      <rect y={HORIZON} width="1000" height={400 - HORIZON} fill={`url(#${id}-sea)`} />

      {/* stars at night */}
      {dark &&
        [
          [560, 40, 1.8], [620, 95, 1.4], [690, 30, 2], [780, 60, 1.5], [850, 120, 1.6],
          [910, 40, 1.8], [470, 80, 1.3], [940, 150, 1.4], [720, 140, 1.2],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={cloudy ? 0.25 : 0.85} />
        ))}

      {/* sun by day, moon by night */}
      {!(cloudy && !dark) && (
        <g>
          <circle cx="800" cy="80" r="125" fill={c.halo} />
          <circle cx="800" cy="80" r="52" fill={c.body} />
          {dark && <circle cx="822" cy="68" r="46" fill={c.skyTop} opacity="0.92" />}
        </g>
      )}

      {/* clouds */}
      {showCloud && (
        <g fill={c.cloud}>
          <rect x="800" y="42" width="190" height="46" rx="23" />
          <circle cx="850" cy="42" r="26" />
          <circle cx="905" cy="36" r="32" />
          {cloudy && (
            <>
              <rect x="560" y="95" width="170" height="40" rx="20" opacity="0.9" />
              <circle cx="610" cy="95" r="22" opacity="0.9" />
              <circle cx="665" cy="90" r="28" opacity="0.9" />
            </>
          )}
        </g>
      )}

      {/* rain */}
      {day.sky === 'rain' &&
        Array.from({ length: 18 }, (_, i) => {
          const x = 560 + i * 24
          const y = 140 + (i % 3) * 22
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - 8}
              y2={y + 26}
              stroke={dark ? 'rgba(190,210,240,0.5)' : 'rgba(70,100,130,0.45)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}

      {/* sailboat, gently bobbing */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 4; 0 0"
          dur="4s"
          repeatCount="indefinite"
        />
        <path d="M498 128 L498 246" stroke={c.sail} strokeWidth="5" strokeLinecap="round" />
        <path d="M506 132 L558 218 L506 218 Z" fill={c.sail} />
        <path d="M460 248 Q500 292 545 248 Z" fill={c.hull} />
      </g>

      {/* waves */}
      <path d={wave(HORIZON, 14)} fill="none" stroke={c.wave} strokeWidth="5" strokeLinecap="round" />
      <path d={wave(HORIZON + 55, 14)} fill="none" stroke={c.wave} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d={wave(HORIZON + 110, 12)} fill="none" stroke={c.wave} strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}