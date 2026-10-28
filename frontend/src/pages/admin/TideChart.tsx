import { useState, type PointerEvent } from 'react'
import { LostFishIcon, SharedFishIcon, SoldFishIcon } from '../../components/home/HomeIcons'
import { TideIcon } from '../../components/icons'
import { DryRackIcon } from './AdminIcons'
import { OUTCOMES, WEEKS } from './data'
import { Card, Chip, Head, type Icon } from './ui'

const ICONS: Icon[] = [SoldFishIcon, SharedFishIcon, DryRackIcon, LostFishIcon]
const W = 640
const H = 240
const PL = 28
const PR = 28
const PT = 22
const PB = 6

// A smooth S-curve between two points, so the layers flow like swells instead of stepping like bars
const bump = (pts: [number, number][]) =>
  pts.slice(1).map(([px, py], i) => {
    const [qx, qy] = pts[i]
    const m = (qx + px) / 2
    return `C${m} ${qy} ${m} ${py} ${px} ${py}`
  }).join('')

export default function TideChart() {
  const [range, setRange] = useState<'4' | '8'>('8')
  const [pick, setPick] = useState(WEEKS[WEEKS.length - 1].label)

  const weeks = range === '4' ? WEEKS.slice(-4) : WEEKS
  const n = weeks.length
  const found = weeks.findIndex((w) => w.label === pick)
  const idx = found === -1 ? n - 1 : found
  const totals = weeks.map((w) => w.kg.reduce((a, b) => a + b, 0))
  const top = Math.ceil(Math.max(...totals) / 500) * 500
  const x = (i: number) => PL + (i * (W - PL - PR)) / (n - 1)
  const y = (v: number) => H - PB - (v / top) * (H - PT - PB)
  const bounds = Array.from({ length: 5 }, (_, k) => weeks.map((w) => w.kg.slice(0, k).reduce((a, b) => a + b, 0)))
  const band = (k: number) => {
    const up = weeks.map((_, i): [number, number] => [x(i), y(bounds[k + 1][i])])
    const lo = weeks.map((_, i): [number, number] => [x(i), y(bounds[k][i])]).reverse()
    return `M${up[0][0]} ${up[0][1]}${bump(up)}L${lo[0][0]} ${lo[0][1]}${bump(lo)}Z`
  }
  const scrub = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PL) / (W - PL - PR)) * (n - 1))
    setPick(weeks[Math.max(0, Math.min(n - 1, i))].label)
  }

  const prev = idx > 0 ? totals[idx - 1] : null
  const delta = prev ? Math.round(((totals[idx] - prev) / prev) * 100) : null

  return (
    <Card>
      <Head icon={TideIcon} title="The weekly tide" sub="Drag across the water to move through the weeks"
        right={
          <div role="radiogroup" aria-label="Range" className="inline-flex rounded-full border border-line bg-seafoam/50 p-1">
            {(['4', '8'] as const).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)}
                className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${range === r ? 'bg-teal text-on-accent shadow-rest' : 'hover:bg-seafoam'}`}>{r} weeks</button>
            ))}
          </div>
        } />

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <b className="font-numeral text-3xl font-bold leading-none">{totals[idx].toLocaleString('en-PH')} kg</b>
        <span className="text-sm text-ink-soft">week of {weeks[idx].label}</span>
        {delta !== null && <Chip tone={delta >= 0 ? 'ok' : 'warn'}>{delta >= 0 ? '+' : ''}{delta}% vs the week before</Chip>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full cursor-crosshair select-none" style={{ touchAction: 'pan-y' }}
        onPointerMove={scrub} onPointerDown={scrub} role="img" aria-label="Catch outcomes per week, stacked as flowing layers">
        <defs>
          {OUTCOMES.map((o, k) => (
            <linearGradient key={o.name} id={`tide-g${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={o.color} stopOpacity="1" />
              <stop offset="1" stopColor={o.color} stopOpacity="0.78" />
            </linearGradient>
          ))}
        </defs>
        {Array.from({ length: top / 500 }, (_, i) => (i + 1) * 500).map((v) => (
          <path key={v} d={`M${PL} ${y(v)}H${W - PR}`} stroke="var(--color-line)" strokeWidth="1.5" strokeDasharray="3 6" />
        ))}
        {OUTCOMES.map((o, k) => <path key={o.name} d={band(k)} fill={`url(#tide-g${k})`} stroke="var(--color-card)" strokeWidth="1.5" strokeLinejoin="round" />)}
        <path d={`M${x(idx)} ${PT - 8}V${H - PB}`} stroke="var(--color-navy)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
        <circle cx={x(idx)} cy={PT - 10} r="6" style={{ fill: 'var(--color-cream)' }} stroke="var(--color-navy)" strokeWidth="2" />
        {OUTCOMES.map((o, k) => <circle key={o.name} cx={x(idx)} cy={y(bounds[k + 1][idx])} r="4.5" fill="var(--color-card)" stroke={o.color} strokeWidth="2.5" />)}
      </svg>

      <div className="relative mt-1 h-8">
        {weeks.map((w, i) => (
          <button key={w.label} type="button" aria-pressed={i === idx} onClick={() => setPick(w.label)} style={{ left: `${(x(i) / W) * 100}%` }}
            className={`absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[11px] transition ${i === idx ? 'bg-teal font-bold text-on-accent' : `text-ink-soft hover:bg-seafoam ${i % 2 && n > 4 ? 'max-sm:hidden' : ''}`}`}>
            {w.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OUTCOMES.map((o, k) => {
          const I = ICONS[k]
          return (
            <div key={o.name} className="rounded-md bg-mint p-3" style={{ borderLeft: `4px solid ${o.color}` }}>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold"><I size={20} />{o.name}</span>
              <b className="mt-1 block font-numeral text-xl leading-tight">{weeks[idx].kg[k].toLocaleString('en-PH')} kg</b>
              <small className="text-xs text-ink-soft">{Math.round((weeks[idx].kg[k] / totals[idx]) * 100)}% of the week</small>
            </div>
          )
        })}
      </div>
    </Card>
  )
}