import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { BuoyIcon } from '../../components/icons'
import { WaveArrow } from '../../components/home/HomeIcons'
import { RISK_MIX, type Risk } from './data'
import { Card, Head } from './ui'

// Four marker buoys on the water. The worse the risk, the lower the buoy floats.
const WATER = 70
const SVG_H = 170
const WL = (SVG_H * WATER) / 130
const CY: Record<Risk, number> = { low: 40, mod: 54, high: 68, crit: 84 }
const LABEL: Record<Risk, string> = { low: 'Low', mod: 'Moderate', high: 'High', crit: 'Critical' }
const NOTE: Record<Risk, string> = {
  low: 'Floating high. These catches have plenty of time.',
  mod: 'Riding level. Keep an eye on these.',
  high: 'Sinking. Selling soon is the best move.',
  crit: 'Almost under. These need action right now.',
}
const WAVE = 'M0 4Q12.5 0 25 4' + Array.from({ length: 15 }, (_, i) => `T${25 * (i + 2)} 4`).join('')
const SEA = `linear-gradient(180deg, var(--color-ice) 0 ${WL}px, var(--tide-sea-0) ${WL}px, var(--tide-sea-2) 100%)`
const bob = (i: number): CSSProperties => ({ ['--bob' as string]: '3px', animationDelay: `${i * 0.5}s` })

function Buoy({ risk, color }: { risk: Risk; color: string }) {
  const cy = CY[risk]
  return (
    <>
      <path d={`M40 ${cy - 16}V${cy - 36}`} stroke="var(--color-deep)" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M40 ${cy - 36}L55 ${cy - 31}L40 ${cy - 26}Z`} style={{ fill: 'var(--color-cream)' }} stroke="var(--color-deep)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="40" cy={cy} r="16" fill={color} stroke="var(--color-deep)" strokeWidth="2" />
      <path d={`M25.5 ${cy - 3}Q40 ${cy + 5} 54.5 ${cy - 3}`} fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

export default function BuoyRack() {
  const [sel, setSel] = useState<Risk | null>(null)
  return (
    <Card className="flex flex-col">
      <Head icon={BuoyIcon} title="Risk right now" sub="Active catches, by how low they float" />
      <div className="relative overflow-hidden rounded-md" style={{ background: SEA }}>
        <svg viewBox="0 0 400 8" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 h-2 w-full" style={{ top: WL - 4 }} aria-hidden="true">
          <path d={WAVE} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="grid grid-cols-4">
          {RISK_MIX.map(([r, pct, color], i) => (
            <button key={r} type="button" aria-pressed={sel === r} aria-label={`${LABEL[r]}: ${pct}%`} onClick={() => setSel(sel === r ? null : r)}
              className={`flex flex-col items-stretch text-center text-white transition aria-pressed:bg-white/15 ${sel && sel !== r ? 'opacity-60' : ''}`}>
              <svg viewBox="0 0 80 130" preserveAspectRatio="xMidYMax meet" className="block w-full" style={{ height: SVG_H }} aria-hidden="true">
                <defs>
                  <clipPath id={`bk-up-${r}`}><rect x="0" y="0" width="80" height={WATER} /></clipPath>
                  <clipPath id={`bk-dn-${r}`}><rect x="0" y={WATER} width="80" height="60" /></clipPath>
                </defs>
                <g clipPath={`url(#bk-up-${r})`}><g className="anim-bob" style={bob(i)}><Buoy risk={r} color={color} /></g></g>
                <g clipPath={`url(#bk-dn-${r})`} opacity="0.38"><g className="anim-bob" style={bob(i)}><Buoy risk={r} color={color} /></g></g>
              </svg>
              <span className="pb-3">
                <b className="block font-numeral text-3xl font-bold leading-none">{pct}%</b>
                <span className="text-[13px] font-semibold text-white/90">{LABEL[r]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <p className="min-h-10 text-sm" aria-live="polite">{sel ? <><b>{LABEL[sel]}:</b> {NOTE[sel]}</> : <span className="text-ink-soft">Tap a buoy to see what it means.</span>}</p>
        <Link to="/admin/listings" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-teal px-4 text-sm font-semibold text-teal hover:bg-seafoam/50">
          See the catches<WaveArrow size={22} />
        </Link>
        <p className="mt-3 text-xs italic text-ink-soft">Estimate only. Not a food-safety test.</p>
      </div>
    </Card>
  )
}