import { useId, useState } from 'react'

export function niceTop(m: number) {
  const raw = m / 4
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = [1, 2, 5, 10].find((x) => x * p >= raw) ?? 10
  return f * p * 4
}

const at = <T,>(a: T[], i: number): T => a[i] as T

// a smooth curve through the points that never dips below or above its neighbours
function smoothPath(p: [number, number][]): string {
  const n = p.length
  if (n === 0) return ''
  if (n === 1) return `M${at(p, 0)[0]},${at(p, 0)[1]}`
  const dx: number[] = []
  const s: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(at(p, i + 1)[0] - at(p, i)[0])
    s.push((at(p, i + 1)[1] - at(p, i)[1]) / at(dx, i))
  }
  const t: number[] = new Array(n).fill(0)
  t[0] = at(s, 0)
  t[n - 1] = at(s, n - 2)
  for (let i = 1; i < n - 1; i++) t[i] = at(s, i - 1) * at(s, i) <= 0 ? 0 : (at(s, i - 1) + at(s, i)) / 2
  for (let i = 0; i < n - 1; i++) {
    const si = at(s, i)
    if (si === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = at(t, i) / si
    const b = at(t, i + 1) / si
    const h = a * a + b * b
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * si; t[i + 1] = k * b * si }
  }
  let d = `M${at(p, 0)[0].toFixed(1)},${at(p, 0)[1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = at(dx, i) / 3
    const [x0, y0] = at(p, i)
    const [x1, y1] = at(p, i + 1)
    d += ` C${(x0 + h).toFixed(1)},${(y0 + at(t, i) * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - at(t, i + 1) * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  return d
}

export type WaveDatum = { label: string; values: number[] }

// smooth wave-like lines with a soft fill underneath and a hover tooltip.
// A series with no data in the period is not drawn, so flat lines never clutter the chart.
export function WaveLines({ data, colors, names, height = 220, empty, unit = '', dots = false, fillSeries }: {
  data: WaveDatum[]
  colors: string[]
  names: string[]
  height?: number
  empty?: string
  unit?: string
  dots?: boolean
  fillSeries?: number[]
}) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const W = 640, H = height, L = 34, R = 12, T = 10, B = 26
  const n = data.length
  const peak = Math.max(0, ...data.flatMap((d) => d.values))
  const top = niceTop(Math.max(peak, 4))
  const x = (i: number) => L + (n <= 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R))
  const y = (v: number) => T + (1 - v / top) * (H - T - B)
  const base = y(0)
  const every = Math.ceil(Math.max(1, n) / 8)
  const lines = names.map((_, k) => data.map((d, i): [number, number] => [x(i), y(d.values[k] ?? 0)]))
  const live = names.map((_, k) => data.some((d) => (d.values[k] ?? 0) > 0))
  const filled = (k: number) => !fillSeries || fillSeries.includes(k)
  const h = hover === null ? null : data[hover]

  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - L) / (W - L - R)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
        {names.map((nm, i) => (
          <span key={nm} className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: colors[i] }} />{nm}</span>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" onMouseMove={move} onMouseLeave={() => setHover(null)}>
          <defs>
            {names.map((_, k) => (
              <linearGradient key={k} id={`${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[k]} stopOpacity="0.22" />
                <stop offset="100%" stopColor={colors[k]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {[0, 1, 2, 3, 4].map((i) => {
            const v = (top / 4) * i
            return (
              <g key={i}>
                <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeOpacity={i === 0 ? 1 : 0.6} />
                <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" className="fill-ink-soft">{Math.round(v)}</text>
              </g>
            )
          })}
          {lines.map((pts, k) => live[k] && n > 1 && (
            <g key={k}>
              {filled(k) && <path d={`${smoothPath(pts)} L${x(n - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`} fill={`url(#${uid}-${k})`} />}
              <path d={smoothPath(pts)} fill="none" stroke={colors[k]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {dots && data.map((d, i) => (d.values[k] ?? 0) > 0 && (
                <circle key={i} cx={x(i)} cy={y(d.values[k] ?? 0)} r="3.5" fill="var(--color-card)" stroke={colors[k]} strokeWidth="2" />
              ))}
            </g>
          ))}
          {data.map((d, i) => i % every === 0 && (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" className="fill-ink-soft">{d.label}</text>
          ))}
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--color-ink-soft)" strokeDasharray="3 3" />
              {names.map((_, k) => live[k] && (
                <circle key={k} cx={x(hover)} cy={y(h.values[k] ?? 0)} r="5" fill={colors[k]} stroke="var(--color-card)" strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-raised"
            style={{ left: `${Math.min(86, Math.max(14, (x(hover) / W) * 100))}%` }}>
            <b className="block">{h.label}</b>
            {names.map((nm, k) => (
              <span key={nm} className="flex items-center gap-1.5 whitespace-nowrap"><i className="size-2 rounded-full" style={{ background: colors[k] }} />{nm}: {h.values[k] ?? 0}{unit}</span>
            ))}
          </div>
        )}
        {peak === 0 && empty && <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-ink-soft">{empty}</p>}
      </div>
    </div>
  )
}