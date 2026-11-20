import { useState, type CSSProperties, type PointerEvent } from 'react'
import { LostFishIcon, SharedFishIcon, SoldFishIcon } from '../../components/home/HomeIcons'
import { TideIcon } from '../../components/icons'
import { Fish } from 'lucide-react'
import { DryRackIcon } from './AdminIcons'
import { weekLabel, type AdminOverview } from '../../lib/adminApi'
import { Card, Chip, Head, type Icon } from './ui'

// one tile per outcome, in the same order as the numbers built below
const TILES: { name: string; color: string; icon: Icon }[] = [
  { name: 'Sold', color: '#2e8391', icon: SoldFishIcon },
  { name: 'Redistributed', color: '#5fa8b5', icon: SharedFishIcon },
  { name: 'Processed', color: '#f2a574', icon: DryRackIcon },
  { name: 'Lost', color: '#e8735a', icon: LostFishIcon },
  { name: 'Still unsold', color: '#6b8c96', icon: Fish },
]

// a round step (10, 20, 50, 100, 200, 500 ...) so the grid has about four lines
function niceStep(max: number): number {
  const raw = Math.max(max, 1) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  return ([1, 2, 5, 10].map((m) => m * p).find((v) => v >= raw)) ?? p * 10
}
const W = 640
const H = 240
const PL = 48
const PR = 20
const PT = 16
const PB = 8

// A smooth S-curve between points, so the line flows like a swell instead of stepping
const bump = (pts: [number, number][]) =>
  pts.slice(1).map(([px, py], i) => {
    const [qx, qy] = pts[i]
    const m = (qx + px) / 2
    return `C${m} ${qy} ${m} ${py} ${px} ${py}`
  }).join('')

// the rippled top edge of the water inside each tile
const RIPPLE = 'M0 4Q15 0 30 4T60 4T90 4T120 4V8H0Z'
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

export default function TideChart({ weeks: raw }: { weeks: AdminOverview['weeks'] }) {
  const WEEKS = raw.map((w) => ({
    label: weekLabel(w.weekStart),
    kg: [w.kg.SOLD, w.kg.REDISTRIBUTED, w.kg.PROCESSED, w.kg.DISCARDED, w.kg.ACTIVE],
  }))
  const [range, setRange] = useState<'4' | '8'>('8')
  const [pick, setPick] = useState(WEEKS[WEEKS.length - 1].label)

  const weeks = range === '4' ? WEEKS.slice(-4) : WEEKS
  const n = weeks.length
  const found = weeks.findIndex((w) => w.label === pick)
  const idx = found === -1 ? n - 1 : found
  const totals = weeks.map((w) => w.kg.reduce((a, b) => a + b, 0))
  const step = niceStep(Math.max(...totals))
  const top = Math.max(step, Math.ceil(Math.max(...totals) / step) * step)
  const x = (i: number) => PL + (i * (W - PL - PR)) / (n - 1)
  const y = (v: number) => H - PB - (v / top) * (H - PT - PB)
  const pts = totals.map((v, i): [number, number] => [x(i), y(v)])
  const line = `M${pts[0][0]} ${pts[0][1]}${bump(pts)}`
  const area = `${line}L${x(n - 1)} ${H - PB}L${x(0)} ${H - PB}Z`
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)

  const scrub = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PL) / (W - PL - PR)) * (n - 1))
    setPick(weeks[Math.max(0, Math.min(n - 1, i))].label)
  }

  // Change vs the week before. A percentage means nothing against a tiny week, so it only shows when last week was 100 kg or more.
  const prev = idx > 0 ? totals[idx - 1] : null
  const diff = prev !== null ? Math.round(totals[idx]) - Math.round(prev) : null
  const pctChange = prev !== null && prev >= 100 && diff !== null ? Math.round((diff / prev) * 100) : null

  return (
    <Card>
      <Head icon={TideIcon} title="The weekly tide" sub="Move across the chart to look at each week"
        right={
          <div role="radiogroup" aria-label="Range" className="inline-flex rounded-full border border-line bg-seafoam/50 p-1">
            {(['4', '8'] as const).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)}
                className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${range === r ? 'bg-teal text-on-accent shadow-rest' : 'hover:bg-seafoam'}`}>{r} weeks</button>
            ))}
          </div>
        } />

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <b className="font-numeral text-3xl font-bold leading-none">{Math.round(totals[idx]).toLocaleString('en-PH')} kg</b>
        <span className="text-sm text-ink-soft">week of {weeks[idx].label}</span>
        {diff !== null && (
          <Chip tone={diff >= 0 ? 'ok' : 'warn'}>
            {diff === 0
              ? 'Same as the week before'
              : `${diff > 0 ? '+' : '−'}${Math.abs(diff).toLocaleString('en-PH')} kg${pctChange !== null ? ` (${pctChange > 0 ? '+' : ''}${pctChange}%)` : ''} vs the week before`}
          </Chip>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full cursor-crosshair select-none" style={{ touchAction: 'pan-y' }}
        onPointerMove={scrub} onPointerDown={scrub} role="img" aria-label="Total catch per week as a line">
        <defs>
          <linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-teal)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--color-teal)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <path d={`M${PL} ${y(v)}H${W - PR}`} stroke="var(--color-line)" strokeWidth="1.5" strokeDasharray={v === 0 ? undefined : '3 6'} />
            <text x={PL - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--color-ink-soft)">{v.toLocaleString('en-PH')}</text>
          </g>
        ))}

        <path d={area} fill="url(#tide-area)" />
        <path d={line} fill="none" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={`M${x(idx)} ${y(totals[idx]) + 8}V${H - PB}`} stroke="var(--color-navy)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
        {pts.map(([px, py], i) => (
          <circle key={weeks[i].label} cx={px} cy={py} r={i === idx ? 7 : 4} fill={i === idx ? 'var(--color-teal)' : 'var(--color-card)'} stroke="var(--color-teal)" strokeWidth="2.5" />
        ))}
      </svg>

      <div className="relative mt-1 h-8">
        {weeks.map((w, i) => (
          <button key={w.label} type="button" aria-pressed={i === idx} onClick={() => setPick(w.label)} style={{ left: `${(x(i) / W) * 100}%` }}
            className={`absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-xs transition ${i === idx ? 'bg-teal font-bold text-on-accent' : `text-ink-soft hover:bg-seafoam ${i % 2 && n > 4 ? 'max-sm:hidden' : ''}`}`}>
            {w.label}
          </button>
        ))}
      </div>

      {/* Outcome vessels: each tile fills with water up to its share of the week */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map((o, k) => {
          const I = o.icon
          const kg = Math.round(weeks[idx].kg[k])
          const pct = totals[idx] === 0 ? 0 : Math.round((weeks[idx].kg[k] / totals[idx]) * 100)
          const level = kg === 0 ? 0 : Math.max(pct, 10)
          return (
            <div key={o.name}
              className={`group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-card p-3.5 transition duration-300 hover:-translate-y-1 hover:shadow-raised ${kg === 0 ? 'opacity-65' : ''}`}
              style={{ boxShadow: kg === 0 ? undefined : `inset 0 -1px 0 ${tint(o.color, 35)}` }}>
              {/* the water */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out" style={{ height: `${level}%` }}>
                <svg viewBox="0 0 120 8" preserveAspectRatio="none" className="anim-bob absolute inset-x-0 -top-[7px] h-2 w-full motion-reduce:[animation:none]"
                  style={{ ['--bob' as string]: '2px', color: o.color, animationDelay: `${k * 0.4}s` } as CSSProperties}>
                  <path d={RIPPLE} fill="currentColor" opacity="0.3" />
                </svg>
                <div className="h-full" style={{ background: `linear-gradient(180deg, ${tint(o.color, 30)}, ${tint(o.color, 14)})` }} />
              </div>

              <div className="relative flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-xl transition group-hover:scale-110" style={{ background: tint(o.color, 18), color: o.color }}>
                  <I size={22} />
                </span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: tint(o.color, 18) }}>{pct}%</span>
              </div>

              <div className="relative mt-3">
                <b className="block font-numeral text-2xl font-bold leading-none">
                  {kg.toLocaleString('en-PH')}<span className="ml-1 text-sm font-semibold text-ink-soft">kg</span>
                </b>
                <span className="mt-1 block text-[13px] font-semibold">{o.name}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}