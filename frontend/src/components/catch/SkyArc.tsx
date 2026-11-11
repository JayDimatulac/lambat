import { bowPoint, bowProgress, isDaytime, phaseOf, type Phase } from '../../lib/skyArc'

const W = 360, H = 225, CX = 180, CY = 175, R = 140
const SKY: Record<Phase, [string, string]> = {
  dawn: ['#2e8391', '#f2b893'],
  day: ['#2e8391', '#fbd9b8'],
  dusk: ['#123f52', '#e8735a'],
  night: ['#05171e', '#0d525e'],
}
const STARS = [[40, 40], [90, 75], [150, 30], [215, 55], [275, 36], [322, 82]]
const BOW = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

export default function SkyArc({ caughtAt, now }: { caughtAt: Date; now: Date }) {
  const day = isDaytime(caughtAt)
  const p = bowProgress(caughtAt)
  const { x, y } = bowPoint(p, CX, CY, R)
  const high = Math.sin(Math.PI * p) // 0 at the horizon, 1 at the top
  const [top, bottom] = SKY[phaseOf(caughtAt)]
  const sun = `color-mix(in oklab, #fbd9b8 ${Math.round(high * 100)}%, #e8735a)`
  // small ring showing where "now" is, only when it is on the same sun/moon half
  const nowPt = isDaytime(now) === day ? bowPoint(bowProgress(now), CX, CY, R) : null
  const labels = day ? ['6 AM', '12 PM', '6 PM'] : ['6 PM', '12 AM', '6 AM']

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id="sky-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: top, transition: 'stop-color .4s' }} />
            <stop offset="1" style={{ stopColor: bottom, transition: 'stop-color .4s' }} />
          </linearGradient>
          <clipPath id="sky-above"><rect x="0" y="0" width={W} height={CY} /></clipPath>
          <mask id="sky-moon">
            <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
            <circle cx="7" cy="-3" r="12" fill="#000" />
          </mask>
        </defs>

        <rect width={W} height={H} fill="url(#sky-bg)" />
        {!day && STARS.map(([sx, sy], i) => (
          <circle key={i} cx={sx} cy={sy} r="1.6" fill="#e6f4f9" className="anim-twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}

        <path d={BOW} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
        {nowPt && <circle cx={nowPt.x} cy={nowPt.y} r="5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />}

        {/* clip at the horizon so the sun/moon sinks into the sea */}
        <g clipPath="url(#sky-above)">
          <g transform={`translate(${x} ${y})`}>
            {day ? (
              <>
                <circle r="30" fill="#fbd9b8" opacity={0.2 + 0.2 * high} />
                {/* rays tilt as the sun moves: this is the "patirik" */}
                <g transform={`rotate(${(p - 0.5) * 50})`} strokeWidth="2.5" strokeLinecap="round" style={{ stroke: sun }}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <line key={i} y1="-22" y2="-28" transform={`rotate(${i * 45})`} />
                  ))}
                </g>
                <circle r="16" style={{ fill: sun }} />
              </>
            ) : (
              <>
                <circle r="28" fill="#e6f4f9" opacity=".15" />
                <circle r="14" fill="#e6f4f9" mask="url(#sky-moon)" />
              </>
            )}
          </g>
        </g>

        <rect x="0" y={CY} width={W} height={H - CY} fill="#0a2f3c" opacity=".9" />
        {labels.map((t, i) => (
          <text key={t} x={CX - R + i * R} y={CY + 30} textAnchor="middle" fontSize="12" fill="#eef6f4" opacity=".8">{t}</text>
        ))}
      </svg>
    </div>
  )
}