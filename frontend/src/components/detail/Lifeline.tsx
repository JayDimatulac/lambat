import { IceBlockIcon } from '../icons'
import type { Catch } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { clockText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

// The whole life of the catch on one rope: caught on the left, the shaded end where it could spoil on the right.
// The buoy rides at "now", the flag marks the sell-by time, a knot marks each time ice was added.
const W = 320
const PAD = 22
const MIN = 60_000

export default function Lifeline({ c, caughtLabel }: { c: Catch; caughtLabel: string }) {
  const t = useT()
  const { lang } = useSettings()
  const now = Date.now()
  const tMin = now + c.minsMin * MIN
  const tMax = now + c.minsMax * MIN
  const span = Math.max(tMax - c.caughtAt, MIN)
  const x = (ts: number) => PAD + ((ts - c.caughtAt) / span) * (W - PAD * 2)
  const xNow = x(now)
  const xMin = x(tMin)
  const xMax = x(tMax)
  const flagX = Math.min(Math.max(xMin, PAD + 34), W - PAD - 34)
  const ice = (c.model?.events ?? []).slice(1)

  return (
    <svg viewBox={`0 0 ${W} 112`} className="w-full" role="img" aria-label={`${caughtLabel} ${clockText(c.caughtAt, lang, t)}`}>
      {/* the part where it could spoil (cautious end to optimistic end) */}
      {xMax - xMin > 3 && (
        <rect x={xMin} y="62" width={xMax - xMin} height="16" rx="8" style={{ fill: RISK[c.risk].fill, fillOpacity: 0.55, stroke: '#fff', strokeOpacity: 0.7 }} strokeDasharray="4 3" />
      )}
      {/* rope: used so far (solid), still to come (dashed) */}
      <path d={`M${PAD} 70H${xNow}`} stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d={`M${xNow} 70H${xMin}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 8" fill="none" />
      {/* start knot */}
      <circle cx={PAD} cy="70" r="7" style={{ fill: 'var(--color-cream)' }} stroke="var(--color-deep)" strokeWidth="2" />
      {/* ice knots */}
      {ice.map((ev) => (
        <g key={ev.at}>
          <circle cx={x(ev.at)} cy="70" r="6" style={{ fill: 'var(--color-ice)' }} stroke="var(--color-deep)" strokeWidth="2" />
          <g transform={`translate(${x(ev.at) - 9} 90)`} style={{ color: '#fff' }}>
            <IceBlockIcon size={18} />
          </g>
        </g>
      ))}
      {/* sell-by flag */}
      <path d={`M${xMin} 70V34`} stroke="var(--color-cream)" strokeWidth="3" strokeLinecap="round" />
      <path d={`M${xMin} 34L${xMin + 16} 40L${xMin} 46Z`} style={{ fill: 'var(--color-coral)' }} stroke="var(--color-cream)" strokeWidth="1.5" strokeLinejoin="round" />
      <text x={flagX} y="24" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
        {clockText(tMin, lang, t).replace(/ yesterday| kahapon/, '')}
      </text>
      {/* the buoy, riding at now */}
      <g transform={`translate(${xNow - 11} 38)`}>
        <ellipse cx="11" cy="24" rx="9" ry="10" style={{ fill: 'var(--color-card)' }} stroke="var(--color-deep)" strokeWidth="2" />
        <path d="M11 2V14" stroke="var(--color-deep)" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 2L19 5L11 8Z" style={{ fill: 'var(--color-coral)' }} />
        <path d="M3 24Q11 28 19 24" fill="none" stroke="var(--color-deep)" strokeWidth="2" />
      </g>
      {/* when it was caught */}
      <text x={PAD} y="108" fontSize="12" fontWeight="600" fill="#fff">
        {caughtLabel} {clockText(c.caughtAt, lang, t)}
      </text>
    </svg>
  )
}