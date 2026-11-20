import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Info } from 'lucide-react'
import { HORIZON_H } from '../../data/mock'
import { RISK, type RiskLevel } from '../../lib/risk'
import { RISK_ICON } from '../ui/RiskBadge'
import { useBT } from '../../lib/buyerText'
import { useSettings } from '../../lib/settings'
import dayImg from '../../assets/bg/buoy-day.png'
import nightImg from '../../assets/bg/buoy-night.png'

/* The buyer's hero. Same picture and buoys as the fisherfolk Home, but each buoy is a lot FOR SALE.
   The lower a buoy has sunk, the less time is left to sell it, so the lowest buoys are the ones worth buying first. */

export type BuoyLot = { id: string; species: string; kg: number; hours: number; risk: RiskLevel }

// Scene geometry (px). Same numbers as the fisherfolk TideScene so both heroes look alike.
const SEABED = 34
const TRAVEL = 88
const LANE = 84
const FLOAT_CY = 42
const HORIZON = 0.4949
const IMG_W = 'max(100cqw, 600px)'

const sunk = (hours: number) => 1 - Math.min(Math.max(hours, 0), HORIZON_H) / HORIZON_H

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

export default function BuyerBuoyScene({ lots, header, to = '/buyer/pier' }: { lots: BuoyLot[]; header?: ReactNode; to?: string }) {
  const b = useBT()
  const { theme } = useSettings()
  const night = theme === 'night'
  const n = lots.length
  const skyH = header ? 140 : 64
  const H = skyH + 6 + TRAVEL + 20 + SEABED
  const yFor = (u: number) => skyH + 6 + u * TRAVEL
  const cols = { gridTemplateColumns: `repeat(${Math.max(n, 1)}, minmax(${LANE}px, 1fr))` }

  // Buoys start at the surface and settle to their depth after the first paint
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section aria-label={b('home.tide.hint')} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      <div className="relative">
        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(n, 1) * LANE }}>
            {/* THE SCENE */}
            <div className="relative overflow-hidden" style={{ height: H, containerType: 'inline-size', background: night ? '#001335' : '#015672' }}>
              <img
                src={night ? nightImg : dayImg}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{ width: IMG_W, left: '50%', transform: 'translateX(-50%)', top: `calc(${skyH}px - ${(HORIZON / 2).toFixed(5)} * ${IMG_W})` }}
              />
              <WaveLine top={skyH + 26} dur={8} opacity={night ? 0.22 : 0.3} />
              <div className="absolute inset-x-0 bottom-0 h-10 border-t-2 border-dashed border-white/30" style={{ background: 'var(--tide-seabed)' }} />

              {/* BUOYS: one per lot for sale */}
              <div className="absolute inset-0 grid" style={cols}>
                {lots.map((l, i) => {
                  const cy = skyH + 6 + (settled ? sunk(l.hours) : 0) * TRAVEL
                  const fill = RISK[l.risk].fill
                  const urgent = l.risk === 'high' || l.risk === 'critical'
                  const move = `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`
                  return (
                    <div key={l.id} className="relative">
                      {urgent && (
                        <div className="absolute left-1/2 size-14 -translate-x-1/2" style={{ top: cy - 28, transition: move }}>
                          <span className="anim-ripple block size-full rounded-full border-2" style={{ borderColor: fill }} />
                        </div>
                      )}
                      <div className="absolute left-1/2 w-14 -translate-x-1/2" style={{ top: cy - FLOAT_CY, transition: move }}>
                        <Link to={to} tabIndex={-1} aria-hidden="true" className="anim-bob block w-full" style={{ '--bob': `${3 * (1 - sunk(l.hours))}px`, animationDelay: `${i * 450}ms` } as CSSProperties}>
                          <BuoyGraphic fill={fill} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* water in front of the buoys */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: skyH + 8, background: 'var(--tide-front)' }} />
              <WaveLine top={skyH + 56} dur={6} opacity={night ? 0.16 : 0.26} className="pointer-events-none" />

              {n === 0 && (
                <p className="absolute inset-x-0 text-center text-base font-semibold text-white" style={{ top: yFor(0.45) }}>
                  {b('home.empty')}
                </p>
              )}
            </div>

            {/* LABELS: one per buoy */}
            <div className="grid px-0" style={cols}>
              {lots.map((l, i) => {
                const r = RISK[l.risk]
                const Icon = l.risk === 'low' ? ArrowUp : RISK_ICON[l.risk]
                return (
                  <div key={l.id} className="relative">
                    {i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-line" />}
                    <Link to={to} className="flex min-h-12 flex-col items-center gap-1 rounded-sm px-1 py-3 text-center hover:bg-seafoam/50">
                      <span className="text-base font-bold leading-tight">{l.species}</span>
                      <span className="text-sm text-ink-soft">{l.kg} kg</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-3 py-1 text-sm font-bold ${r.text} ${r.bg} ${r.line}`}>
                        <Icon size={14} strokeWidth={2.4} aria-hidden />
                        {b('home.hours.left', { n: Math.max(1, Math.round(l.hours)) })}
                      </span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* depth scale: stays put while the scene scrolls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ height: H }} aria-hidden="true">
          {[
            { u: 0, label: '24h' },
            { u: 0.5, label: '12h' },
            { u: 1, label: '0h' },
          ].map((tick) => (
            <div key={tick.label} className="absolute inset-x-0" style={{ top: yFor(tick.u) }}>
              <span className="absolute left-3 -translate-y-1/2 text-[13px] font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(10,47,60,0.7)' }}>
                {tick.label}
              </span>
              <span className="absolute left-12 right-0 border-t border-dashed border-white/25" />
            </div>
          ))}
        </div>

        {header && <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 [&_a]:pointer-events-auto">{header}</div>}
      </div>

      <p className="simple-hide flex items-center justify-center gap-2 border-t border-line px-4 py-3 text-sm font-medium text-teal">
        <Info size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        {b('home.tide.hint')}
      </p>
    </section>
  )
}