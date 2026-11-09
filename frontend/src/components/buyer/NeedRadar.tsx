import { useState } from 'react'

export type Blip = { id: string; label: string; place: string; kg: number; km: number; bearing: number; reach: boolean }

const C = 200
const R = 170

/* A radar of real buyer needs. You are in the middle. The farther a dot, the farther the buyer. */
export default function NeedRadar({ blips, selectedId, onSelect, range, youLabel }: {
  blips: Blip[]
  selectedId: string | null
  onSelect: (id: string) => void
  range: number
  youLabel?: string
}) {
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const pos = (km: number, bearing: number) => {
    const r = Math.min(km / range, 1) * R
    const a = (bearing * Math.PI) / 180
    return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) }
  }
  const shown = blips.filter((b) => b.km <= range).sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))

  return (
    <svg viewBox="0 0 400 400" role="group" aria-label="Buyer radar" className="mx-auto block w-full max-w-[460px]">
      {[1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle cx={C} cy={C} r={(R * i) / 4} fill="none" stroke="var(--color-cream)" strokeOpacity={i === 4 ? 0.55 : 0.25} strokeDasharray={i === 4 ? undefined : '4 6'} />
          <text x={C + 4} y={C - (R * i) / 4 + 12} fontSize="11" fill="var(--color-cream)" fillOpacity="0.7">{Math.round((range * i) / 4)} km</text>
        </g>
      ))}
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--color-cream)" strokeOpacity="0.2" />
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--color-cream)" strokeOpacity="0.2" />
      <text x={C} y={C - R - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-cream)">N</text>

      {!still && (
        <path d={`M${C} ${C} L${C} ${C - R} A${R} ${R} 0 0 1 ${C + R * Math.sin(Math.PI * 0.2)} ${C - R * Math.cos(Math.PI * 0.2)} Z`} fill="var(--color-cream)" fillOpacity="0.14">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${C} ${C}`} to={`360 ${C} ${C}`} dur="6s" repeatCount="indefinite" />
        </path>
      )}

      <circle cx={C} cy={C} r="11" fill="var(--color-cream)" />
      <text x={C} y={C + 28} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-cream)">{youLabel ? `You · ${youLabel}` : 'You'}</text>

      {shown.map((b) => {
        const { x, y } = pos(b.km, b.bearing)
        const on = b.id === selectedId
        return (
          <g
            key={b.id}
            role="button"
            tabIndex={0}
            aria-label={`${b.label}${b.place ? ` in ${b.place}` : ''}, ${b.kg} kg, ${b.km.toFixed(1)} km, ${b.reach ? 'can arrive in time' : 'may be too late'}`}
            aria-pressed={on}
            onClick={() => onSelect(b.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(b.id) } }}
            className="cursor-pointer outline-none"
          >
            <title>{`${b.label}${b.place ? ` · ${b.place}` : ''} · ${b.kg} kg · ${b.km.toFixed(1)} km`}</title>
            {on && <circle cx={x} cy={y} r="26" fill="none" stroke="var(--color-coral)" strokeWidth="2" />}
            <circle cx={x} cy={y} r="20" fill="transparent" />
            <circle
              cx={x} cy={y} r={on ? 17 : 14}
              fill={b.reach ? 'var(--color-coral)' : 'var(--color-deep)'}
              stroke="var(--color-cream)"
              strokeWidth="2"
              strokeDasharray={b.reach ? undefined : '3 3'}
            />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={b.reach ? 'var(--color-deep)' : 'var(--color-cream)'} pointerEvents="none">{b.kg}</text>
            {on && b.place && (
              <text x={x} y={y + 42} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-cream)" pointerEvents="none">{b.place}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}