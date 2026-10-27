import PierIcon from './PierGlyph'
import { MAX_KM, type Match } from '../../lib/buyers'

// The pantalan radar. You are at the pier in the middle. A beam sweeps like the parola's light.
// The nearer a dot, the nearer the buyer. A filled dot can be reached in time, a dashed one cannot.
const R = 128
const C = 150
const radius = (km: number) => R * Math.sqrt(km / MAX_KM)
const at = (km: number, bearing: number): [number, number] => {
  const a = (bearing * Math.PI) / 180
  return [C + radius(km) * Math.sin(a), C - radius(km) * Math.cos(a)]
}

type Props = { matches: Match[]; selectedId: string | null; onSelect: (id: string) => void; accent: string; label: (m: Match) => string }

export default function Radar({ matches, selectedId, onSelect, accent, label }: Props) {
  const best = matches.find((m) => m.reachable)?.party.id
  return (
    <svg viewBox="0 0 300 300" className="mx-auto block w-full max-w-[440px]">
      <defs>
        <radialGradient id="radar-bg">
          <stop offset="0" stopColor="#0f4a5c" />
          <stop offset="1" stopColor="#05171e" />
        </radialGradient>
        <linearGradient id="radar-sweep" gradientUnits="userSpaceOnUse" x1="150" y1="20" x2="226" y2="44">
          <stop offset="0" stopColor="#fbd9b8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fbd9b8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={R + 12} fill="url(#radar-bg)" />
      <circle cx={C} cy={C} r={R + 12} fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      {[5, 10, 20].map((km) => (
        <g key={km}>
          <circle cx={C} cy={C} r={radius(km)} fill="none" stroke="#fff" strokeOpacity="0.2" strokeDasharray="3 5" />
          <text x={C + radius(km) * 0.707 + 3} y={C + radius(km) * 0.707 + 12} fontSize="12" fontWeight="600" fill="#fff" fillOpacity="0.8">{km} km</text>
        </g>
      ))}
      <path d={`M${C} ${C - R - 12}V${C + R + 12}M${C - R - 12} ${C}H${C + R + 12}`} stroke="#fff" strokeOpacity="0.12" />
      <text x={C} y="15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">N</text>

      <g className="anim-radar" style={{ transformOrigin: `${C}px ${C}px` }}>
        <path d={`M${C} ${C}L${C} ${C - R - 6}A${R + 6} ${R + 6} 0 0 1 ${C + (R + 6) * Math.sin(0.62)} ${C - (R + 6) * Math.cos(0.62)}Z`} fill="url(#radar-sweep)" />
      </g>

      {matches.map((m) => {
        const [x, y] = at(m.party.km, m.party.bearing)
        const on = m.party.id === selectedId
        const r = m.reachable ? 8 + (m.score / 100) * 5 : 7
        return (
          <g key={m.party.id} role="button" tabIndex={0} aria-label={label(m)} aria-pressed={on} className="cursor-pointer outline-none" onClick={() => onSelect(m.party.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(m.party.id)}>
            <circle cx={x} cy={y} r="22" fill="transparent" />
            {m.party.id === best && <circle cx={x} cy={y} r={r + 2} fill="none" stroke="#e8735a" strokeWidth="2" className="anim-ripple" style={{ transformOrigin: `${x}px ${y}px` }} />}
            {on && <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#fff" strokeWidth="2.5" />}
            <circle cx={x} cy={y} r={r} fill={m.reachable ? accent : 'rgba(5,23,30,0.6)'} stroke={m.reachable ? '#fbd9b8' : '#fff'} strokeOpacity={m.reachable ? 1 : 0.55} strokeWidth="2" strokeDasharray={m.reachable ? undefined : '3 3'} />
            {on && (
              <text x={x > 215 ? x - r - 9 : x + r + 9} y={y + 4} textAnchor={x > 215 ? 'end' : 'start'} fontSize="12" fontWeight="700" fill="#fff" stroke="#05171e" strokeWidth="3.5" paintOrder="stroke">
                {m.price !== undefined ? `₱${m.price}` : m.party.name.split(' ')[0]}
              </text>
            )}
          </g>
        )
      })}

      <circle cx={C} cy={C} r="17" fill="#fbd9b8" stroke="#0a2f3c" strokeWidth="2" />
      <g transform={`translate(${C - 12} ${C - 12})`} style={{ color: '#0a2f3c' }}><PierIcon /></g>
    </svg>
  )
}