// The picture on the way in: a nautical chart and a tide staff, not an illustration.
// Fine depth contours and a ruled border set the scene. The staff reads in hours left (24 at the top,
// 0 at the seabed), the same scale as the app. Its waterline settles once when the page opens.
// The contour depths are decoration, not real soundings.

type Family = { cx: number; cy: number; seed: number; radii: number[]; labels: (string | null)[] }

// Organic closed contour around a centre. Same seed for every radius keeps the lines parallel, like isobaths.
function ring(cx: number, cy: number, r: number, seed: number) {
  const k = (t: number) => 1 + 0.16 * Math.sin(2 * t + seed) + 0.09 * Math.sin(3 * t + seed * 1.7) + 0.05 * Math.sin(5 * t + seed * 0.6)
  const steps = 96
  let d = ''
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const x = cx + Math.cos(t) * r * k(t) * 1.25
    const y = cy + Math.sin(t) * r * k(t) * 0.8
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return { d: `${d}Z`, lx: cx + r * k(0) * 1.25, ly: cy }
}

const FAMILIES: Family[] = [
  { cx: 112, cy: 214, seed: 0.7, radii: [14, 28, 44, 62, 82], labels: [null, '40', null, '20', null] },
  { cx: 318, cy: 76, seed: 2.3, radii: [10, 22, 35, 48], labels: [null, '5', '10', null] },
]
const CONTOURS = FAMILIES.flatMap((f) =>
  f.radii.map((r, i) => ({ ...ring(f.cx, f.cy, r, f.seed), label: f.labels[i], bold: f.labels[i] !== null })),
)

const STAFF_TOP = 8
const STAFF_H = 224
const yOf = (hours: number) => STAFF_TOP + ((24 - hours) / 24) * STAFF_H
const LEVEL = 15 // the example waterline, in hours

/* A net mesh drawn as a mark: two sets of crossing diagonals with a knot at each crossing */
export function NetMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <defs>
        <clipPath id="net-mark-clip"><circle cx="16" cy="16" r="15" /></clipPath>
      </defs>
      <g clipPath="url(#net-mark-clip)" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M0 16L16 0M0 32L32 0M16 32L32 16" />
        <path d="M0 16L16 32M0 0L32 32M16 0L32 16" />
      </g>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.3" />
      {([[8, 8], [24, 8], [8, 24], [24, 24]] as const).map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" fill="currentColor" />)}
      <circle cx="16" cy="16" r="2.6" fill="#e8735a" />
    </svg>
  )
}

const RULER = 'repeating-linear-gradient(90deg, rgba(255,255,255,.3) 0 1px, transparent 1px 12px)'
const RULER_V = 'repeating-linear-gradient(180deg, rgba(255,255,255,.3) 0 1px, transparent 1px 12px)'

export default function AuthScene() {
  return (
    <>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <linearGradient id="chart-sea" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#0a2f3c" />
            <stop offset="1" stopColor="#0d4a57" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#chart-sea)" />
        <g fill="none" stroke="#dcefea" strokeLinejoin="round">
          {CONTOURS.map((c, i) => (
            <path key={i} d={c.d} strokeWidth={c.bold ? 1.2 : 0.9} strokeOpacity={c.bold ? 0.34 : 0.17} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g fill="#dcefea" fillOpacity=".6" fontSize="6.5" textAnchor="middle" style={{ fontFamily: 'var(--font-numeral)' }}>
          {CONTOURS.filter((c) => c.label).map((c, i) => (
            <text key={i} x={c.lx} y={c.ly + 2.3} stroke="#0b3b48" strokeWidth="3" paintOrder="stroke">{c.label}</text>
          ))}
        </g>
      </svg>

      {/* the chart's border, with a ruler along each edge */}
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-white/15 lg:inset-5" />
      <div aria-hidden className="pointer-events-none absolute inset-x-3 top-3 h-1.5 lg:inset-x-5 lg:top-5" style={{ backgroundImage: RULER }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 h-1.5 lg:inset-x-5 lg:bottom-5" style={{ backgroundImage: RULER }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-3 left-3 w-1.5 lg:inset-y-5 lg:left-5" style={{ backgroundImage: RULER_V }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-3 right-3 w-1.5 lg:inset-y-5 lg:right-5" style={{ backgroundImage: RULER_V }} />

      {/* the tide staff */}
      <div aria-hidden className="pointer-events-none absolute bottom-14 right-5 top-[76px] flex justify-end lg:bottom-28 lg:right-16 lg:top-28">
        <svg viewBox="0 0 100 240" className="h-full" style={{ aspectRatio: '100 / 240' }}>
          <defs>
            <linearGradient id="staff-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#94c1c9" stopOpacity=".34" />
              <stop offset="1" stopColor="#94c1c9" stopOpacity=".08" />
            </linearGradient>
          </defs>

          {/* the staff: a block every two hours, a numeral every six */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="64" y={STAFF_TOP + (i * STAFF_H) / 12} width="16" height={STAFF_H / 12} fill={i % 2 === 0 ? '#eef6f4' : 'none'} fillOpacity=".5" />
          ))}
          <rect x="64" y={STAFF_TOP} width="16" height={STAFF_H} fill="none" stroke="#dcefea" strokeOpacity=".65" strokeWidth=".8" />
          {[0, 6, 12, 18, 24].map((h) => (
            <g key={h}>
              <line x1="56" x2="64" y1={yOf(h)} y2={yOf(h)} stroke="#dcefea" strokeOpacity=".7" strokeWidth=".8" />
              <text x="52" y={yOf(h) + 3.2} textAnchor="end" fontSize="9" fill="#dcefea" fillOpacity=".85" style={{ fontFamily: 'var(--font-numeral)' }}>{h}</text>
            </g>
          ))}

          {/* the water, over the staff, settling once into place */}
          <g className="anim-settle">
            <rect x="0" y={yOf(LEVEL)} width="100" height="320" fill="url(#staff-water)" />
            <line x1="0" x2="100" y1={yOf(LEVEL)} y2={yOf(LEVEL)} stroke="#eef6f4" strokeOpacity=".9" strokeWidth="1.2" />
            <path d={`M82 ${yOf(LEVEL)}L92 ${yOf(LEVEL) - 6}V${yOf(LEVEL) + 6}Z`} fill="#e8735a" />
            <text x="2" y={yOf(LEVEL) - 8} fontSize="24" fontWeight="700" fill="#ffffff" style={{ fontFamily: 'var(--font-numeral)' }}>
              {LEVEL}
              <tspan fontSize="11" dx="2" fillOpacity=".8">h</tspan>
            </text>
          </g>
        </svg>
      </div>
    </>
  )
}