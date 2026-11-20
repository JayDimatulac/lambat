import { useEffect, useId, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Info } from 'lucide-react'
import { BuoyIcon } from '../../components/icons'
import { WaveArrow } from '../../components/home/HomeIcons'
import { RISK_ICON } from '../../components/ui/RiskBadge'
import { HORIZON_H } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { useSettings } from '../../lib/settings'
import type { AdminOverview } from '../../lib/adminApi'
import dayImg from '../../assets/bg/buoy-day.png'
import nightImg from '../../assets/bg/buoy-night.png'
import type { Risk } from './data'
import { Card, Head } from './ui'

// The most urgent catches, worst first. Optional: nothing shows until the dashboard passes some.
export type UrgentCatch = { species: string; kg: number; left: string; place?: string }

// The same sea as the fisherfolk tide scene (components/tide/TideScene.tsx): a picture for the sky and water,
// thin drifting waves, and buoys that sink the less time is left. Here there is one buoy per risk level.
const SKY = 64
const SEABED = 34
const TRAVEL = 88
const FLOAT_CY = 42 // y of the buoy's float centre inside its 44x68 drawing
const H = SKY + 6 + TRAVEL + 20 + SEABED
const yFor = (u: number) => SKY + 6 + u * TRAVEL
// The picture is 2:1 and its horizon sits 49.49% down. It is placed so the horizon lands on the waterline (SKY).
const HORIZON = 0.4949
const IMG_W = 'max(100cqw, 600px)'
// 1 at the surface (24h+ left) ... 0 at the seabed (0h left), inverted to "how far it has sunk"
const sunk = (hours: number) => 1 - Math.min(Math.max(hours, 0), HORIZON_H) / HORIZON_H

const ORDER: Risk[] = ['low', 'mod', 'high', 'crit']
const LEVEL = { low: 'low', mod: 'moderate', high: 'high', crit: 'critical' } as const
const LABEL: Record<Risk, string> = { low: 'Low', mod: 'Moderate', high: 'High', crit: 'Critical' }
// Hours left behind each level. These are the same limits the backend uses (shelfLife.ts RISK_HOURS: 2 / 6 / 14).
const HOURS: Record<Risk, [number, number]> = { low: [14, 24], mod: [6, 14], high: [2, 6], crit: [0, 2] }
const RANGE: Record<Risk, string> = { low: '14–24+', mod: '6–14', high: '2–6', crit: '0–2' }
const NOTE: Record<Risk, string> = {
  low: 'Floating high. These catches have plenty of time.',
  mod: 'Riding level. Keep an eye on these.',
  high: 'Sinking. Selling soon is the best move.',
  crit: 'Almost under. These need action right now.',
}

function BuoyGraphic({ fill }: { fill: string }) {
  return (
    <svg width="44" height="68" viewBox="0 0 44 68" className="mx-auto block" aria-hidden="true">
      <path d="M22 5V26" stroke="var(--color-deep)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 5L36 10.5L22 16Z" style={{ fill: 'var(--color-coral)' }} stroke="var(--color-deep)" strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cx="22" cy="43" rx="15" ry="17" style={{ fill }} />
      <path d="M7.3 40.5Q22 46 36.7 40.5L37 47.5Q22 53 7 47.5Z" style={{ fill: 'var(--color-cream)' }} />
      <ellipse cx="22" cy="43" rx="15" ry="17" fill="none" stroke="var(--color-deep)" strokeWidth="2.2" />
      <path d="M12.5 37Q14 31.5 19 29.5" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="22" cy="26" r="3" style={{ fill: 'var(--color-card)' }} stroke="var(--color-deep)" strokeWidth="1.8" />
    </svg>
  )
}

// A thin line of waves drifting sideways over the picture. One wavelength is `wl` px, so the loop is seamless.
function WaveLine({ top, wl = 120, dur, opacity, className = '' }: { top: number; wl?: number; dur: number; opacity: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      aria-hidden="true"
      className={`stage-wave absolute left-0 h-4 ${className}`}
      style={{ top, width: `calc(100% + ${wl}px)`, '--wl': `${wl}px`, animationDuration: `${dur}s` } as CSSProperties}
    >
      <defs>
        <pattern id={id} width={wl} height="16" patternUnits="userSpaceOnUse">
          <path d={`M0 8Q${wl / 4} 2 ${wl / 2} 8T${wl} 8`} fill="none" stroke="#fff" strokeOpacity={opacity} strokeWidth="2" strokeLinecap="round" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${id})`} />
    </svg>
  )
}

export default function BuoyRack({ riskNow, urgent }: { riskNow: AdminOverview['riskNow']; urgent?: UrgentCatch[] }) {
  const { theme } = useSettings()
  const night = theme === 'night'
  // sel: the buoy that was tapped or clicked. hover: the buoy under the mouse. Either one shows its card.
  const [sel, setSel] = useState<Risk | null>(null)
  const [hover, setHover] = useState<Risk | null>(null)
  // Buoys start at the surface and settle to their depth after the first paint
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const count: Record<Risk, number> = { low: riskNow.low, mod: riskNow.moderate, high: riskNow.high, crit: riskNow.critical }
  const total = ORDER.reduce((n, r) => n + count[r], 0)
  const pctOf = (r: Risk) => (total === 0 ? 0 : Math.round((count[r] / total) * 100))
  const crit = count.crit
  const toggle = (r: Risk) => setSel(sel === r ? null : r)

  return (
    <Card className="flex flex-col">
      <Head icon={BuoyIcon} title="Risk right now" sub="Active catches, by how low they float" />

      {/* THE SCENE */}
      <div className="relative overflow-hidden rounded-md" style={{ height: H, containerType: 'inline-size', background: night ? '#001335' : '#015672' }}>
        {/* BACKGROUND: sky, mountains, sun or moon and the sea, as one picture. Buoys and waves are drawn on top. */}
        <img
          src={night ? nightImg : dayImg}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={{ width: IMG_W, left: '50%', transform: 'translateX(-50%)', top: `calc(${SKY}px - ${(HORIZON / 2).toFixed(5)} * ${IMG_W})` }}
        />
        <WaveLine top={SKY + 26} dur={8} opacity={night ? 0.22 : 0.3} />

        {/* BUOYS */}
        <div className="absolute inset-0 grid grid-cols-4">
          {ORDER.map((r, i) => {
            const [hMin, hMax] = HOURS[r]
            const mid = sunk((hMin + hMax) / 2)
            const hi = sunk(hMin)
            const cy = yFor(settled ? mid : 0)
            const fill = RISK[LEVEL[r]].fill
            const rk = RISK[LEVEL[r]]
            const RiskIcon = r === 'low' ? ArrowUp : RISK_ICON[LEVEL[r]]
            const has = count[r] > 0
            const urgentOne = has && (r === 'high' || r === 'crit')
            const isActive = hover === r || sel === r
            const above = cy - FLOAT_CY - 96 > 4 // flip the card below the buoy when there is no room above
            const justify = i === 0 ? 'justify-start' : i === ORDER.length - 1 ? 'justify-end' : 'justify-center'
            const move = `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`
            return (
              <div key={r} className={`relative transition-opacity ${has ? '' : 'opacity-50'} ${sel && sel !== r ? 'opacity-70' : ''}`}>
                {/* the rope hangs from the buoy down to the earliest it could sink: its length shows the range of time left */}
                {(() => {
                  const ropeTop = cy + 16
                  const ropeEnd = Math.min(Math.max(yFor(hi), cy + 34), yFor(1) + 8)
                  const len = Math.max(ropeEnd - ropeTop, 0)
                  if (len < 4) return null
                  return (
                    <span
                      className="absolute left-1/2 w-2 -translate-x-1/2 rounded-full border-[1.5px]"
                      style={{
                        top: ropeTop,
                        height: len,
                        background: fill,
                        borderColor: `color-mix(in srgb, ${fill} 65%, var(--color-deep))`,
                        transition: `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms, height 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`,
                      }}
                    >
                      <span className="absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-white/60" />
                    </span>
                  )
                })()}
                {urgentOne && (
                  <div className="absolute left-1/2 size-14 -translate-x-1/2" style={{ top: cy - 28, transition: move }}>
                    <span className="anim-ripple block size-full rounded-full border-2" style={{ borderColor: fill }} />
                  </div>
                )}
                <div className="absolute left-1/2 w-14 -translate-x-1/2" style={{ top: cy - FLOAT_CY, transition: move, zIndex: isActive ? 20 : undefined }}>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(r) }}
                    onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover((h) => (h === r ? null : h)) }}
                    onClick={() => toggle(r)}
                    className={`pointer-events-auto block w-full cursor-pointer ${has ? 'anim-bob' : ''}`}
                    style={{ '--bob': `${3 * (1 - mid)}px`, animationDelay: `${i * 450}ms` } as CSSProperties}
                  >
                    <span className="block origin-bottom transition-transform duration-200" style={{ transform: isActive ? 'scale(1.12)' : undefined }}>
                      <BuoyGraphic fill={fill} />
                    </span>
                  </button>
                </div>

                {/* the card: risk level, how many catches and the time left. Hover a buoy to see it, tap to pin it. */}
                {isActive && (
                  <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-30 flex px-1 ${justify}`} style={{ top: above ? cy - FLOAT_CY - 8 : cy + 26 }}>
                    <div className={`w-44 rounded-md border border-line bg-card p-2.5 text-navy shadow-raised ${above ? '-translate-y-full' : ''}`}>
                      <p className="font-numeral text-base font-bold leading-tight">{LABEL[r]}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{count[r]} {count[r] === 1 ? 'catch' : 'catches'} · {pctOf(r)}%</p>
                      <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold ${rk.text} ${rk.bg} ${rk.line}`}>
                        <RiskIcon size={13} strokeWidth={2.4} />
                        {RANGE[r]}h left
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <WaveLine top={SKY + 56} dur={6} opacity={night ? 0.16 : 0.26} className="pointer-events-none" />

        {/* depth scale: the same 24h to 0h scale as the fisherfolk scene */}
        <div className="pointer-events-none absolute inset-0 z-10 max-sm:hidden" aria-hidden="true">
          {[{ u: 0, label: '24h' }, { u: 0.5, label: '12h' }, { u: 1, label: '0h' }].map((tick) => (
            <div key={tick.label} className="absolute inset-x-0" style={{ top: yFor(tick.u) }}>
              <span className="absolute left-3 -translate-y-1/2 text-[13px] font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(10,47,60,0.7)' }}>{tick.label}</span>
              <span className="absolute left-12 right-0 border-t border-dashed border-white/25" />
            </div>
          ))}
        </div>

        {total === 0 && (
          <p className="absolute inset-x-0 text-center text-base font-semibold text-white" style={{ top: yFor(0.45) }}>No active catches right now.</p>
        )}
      </div>

      {/* LABELS: one per buoy, always readable on a plain surface */}
      <div className="mt-1 grid grid-cols-4">
        {ORDER.map((r, i) => {
          const rk = RISK[LEVEL[r]]
          const Icon = r === 'low' ? ArrowUp : RISK_ICON[LEVEL[r]]
          const n = count[r]
          return (
            <div key={r} className="relative">
              {/* thin divider between levels */}
              {i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-line" />}
              <button
                type="button"
                aria-pressed={sel === r}
                aria-label={`${LABEL[r]}: ${pctOf(r)}%, ${n} ${n === 1 ? 'catch' : 'catches'}`}
                onClick={() => toggle(r)}
                onMouseEnter={() => setHover(r)}
                onMouseLeave={() => setHover((h) => (h === r ? null : h))}
                onFocus={() => setHover(r)}
                onBlur={() => setHover((h) => (h === r ? null : h))}
                className={`flex min-h-12 w-full flex-col items-center gap-1 rounded-sm px-1 py-3 text-center transition hover:bg-seafoam/50 aria-pressed:bg-seafoam ${n === 0 && sel !== r ? 'opacity-60' : ''}`}
              >
                <b className="font-numeral text-3xl font-bold leading-none">{pctOf(r)}%</b>
                <span className="text-base font-bold leading-tight">{LABEL[r]}</span>
                <span className="text-sm text-ink-soft">{n} {n === 1 ? 'catch' : 'catches'}</span>
                <span className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-3 py-1 text-sm font-bold ${rk.text} ${rk.bg} ${rk.line}`}>
                  <Icon size={14} strokeWidth={2.4} aria-hidden />
                  {RANGE[r]}h
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* The most urgent catches, when the dashboard has them */}
      {urgent && urgent.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-md border border-line">
          {urgent.slice(0, 3).map((c) => (
            <li key={c.species + c.kg + c.left} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: RISK.critical.fill }} />
              <b className="flex-1 truncate">{c.species} · {c.kg} kg{c.place ? ` · ${c.place}` : ''}</b>
              <span className="shrink-0 font-semibold text-risk-critical">{c.left}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-3">
        <p className="min-h-10 text-sm" aria-live="polite">
          {total === 0 ? <span className="text-ink-soft">No active catches right now.</span> : sel ? <><b>{LABEL[sel]}:</b> {NOTE[sel]}</> : <span className="text-ink-soft">Tap a buoy to see what it means.</span>}
        </p>
        <Link
          to="/admin/listings"
          className={`mt-2 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${crit > 0 ? 'bg-coral text-deep shadow-rest hover:bg-coral-dark hover:text-white' : 'border-[1.5px] border-teal text-teal hover:bg-seafoam/50'}`}
        >
          {crit > 0 ? `Review ${crit} critical ${crit === 1 ? 'catch' : 'catches'}` : 'See the catches'}
          <WaveArrow size={22} />
        </Link>
      </div>

      <p className="-mx-5 -mb-5 mt-4 flex items-center justify-center gap-2 rounded-b-lg border-t border-line px-4 py-3 text-sm font-medium text-teal">
        <Info size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        Estimate only. Not a food-safety test.
      </p>
    </Card>
  )
}