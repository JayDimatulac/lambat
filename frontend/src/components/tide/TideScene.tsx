import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HORIZON_H, type Catch } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { RISK_ICON } from '../ui/RiskBadge'
import { useT } from '../../lib/i18n'
import { rangeText } from '../../lib/time'

// Scene geometry (px). The sea is a fixed-height strip; each buoy sinks along TRAVEL as time runs out.
const SEABED = 40
const TRAVEL = 112
const LANE = 84
const FLOAT_CY = 42 // y of the buoy's float centre inside its 44x68 drawing

// 1 at the surface (24h+ left) ... 0 at the seabed (0h left), inverted to "how far it has sunk"
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

// A strip of waves that drifts sideways. One wavelength is 60px, so the loop is seamless.
function Wave({ color, top, className }: { color: string; top: number; className: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg aria-hidden="true" className={`absolute left-0 h-4 ${className}`} style={{ top, width: 'calc(100% + 60px)' }}>
      <defs>
        <pattern id={id} width="60" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8Q15 0 30 8T60 8V16H0Z" style={{ fill: color }} />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${id})`} />
    </svg>
  )
}

type Props = { catches: Catch[]; header?: ReactNode }

export default function TideScene({ catches, header }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const n = catches.length
  const skyH = header ? 152 : 64
  const H = skyH + 6 + TRAVEL + 22 + SEABED
  const yFor = (u: number) => skyH + 6 + u * TRAVEL
  const cols = { gridTemplateColumns: `repeat(${Math.max(n, 1)}, minmax(${LANE}px, 1fr))` }

  // Buoys start at the surface and settle to their depth after the first paint
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section aria-label={t('tide.hint')} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      <div className="relative">
        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(n, 1) * LANE }}>
            {/* THE SCENE */}
            <div className="relative overflow-hidden" style={{ height: H }}>
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, var(--tide-sky-0) 0, var(--tide-sky-1) ${Math.round(skyH * 0.8)}px, var(--tide-sky-2) ${skyH}px)` }}
              />
              {/* sun by day, moon by night, setting into the water */}
              <div
                className="absolute right-[14%] size-11 rounded-full"
                style={{ top: skyH - 30, background: 'var(--tide-sun)', boxShadow: '0 0 36px 12px var(--tide-sun-glow)' }}
              />
              <div className="absolute inset-x-0 bottom-0" style={{ top: skyH + 7, background: 'linear-gradient(180deg, var(--tide-sea-0), var(--tide-sea-1) 45%, var(--tide-sea-2))' }} />
              <Wave color="var(--tide-sea-0)" top={skyH - 8} className="anim-drift" />
              <div className="absolute inset-x-0 bottom-0 h-10 border-t-2 border-dashed border-white/30" style={{ background: 'var(--tide-seabed)' }} />

              {/* BUOYS */}
              <div className="absolute inset-0 grid" style={cols}>
                {catches.map((c, i) => {
                  const mid = sunk((c.hoursMin + c.hoursMax) / 2)
                  const lo = sunk(c.hoursMax)
                  const hi = sunk(c.hoursMin)
                  const cy = yFor(settled ? mid : 0)
                  const fill = RISK[c.risk].fill
                  const urgent = c.risk === 'high' || c.risk === 'critical'
                  const move = `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`
                  return (
                    <div key={c.id} className="relative">
                      {/* the band shows the uncertainty: the buoy could be anywhere in here */}
                      {hi - lo > 0.02 && (
                        <span
                          className="absolute left-1/2 w-2 -translate-x-1/2 rounded-full border border-dashed border-white/60"
                          style={{
                            top: yFor(lo),
                            height: yFor(hi) - yFor(lo),
                            background: `color-mix(in srgb, ${fill} 45%, transparent)`,
                            opacity: settled ? 1 : 0,
                            transition: 'opacity 0.6s ease 1.2s',
                          }}
                        />
                      )}
                      {urgent && (
                        <div className="absolute left-1/2 size-14 -translate-x-1/2" style={{ top: cy - 28, transition: move }}>
                          <span className="anim-ripple block size-full rounded-full border-2" style={{ borderColor: fill }} />
                        </div>
                      )}
                      <div className="absolute left-1/2 w-14 -translate-x-1/2" style={{ top: cy - FLOAT_CY, transition: move }}>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden="true"
                          onClick={() => navigate(`/catches/${c.id}`)}
                          className="anim-bob block w-full cursor-pointer"
                          style={{ '--bob': `${3 * (1 - mid)}px`, animationDelay: `${i * 450}ms` } as CSSProperties}
                        >
                          <BuoyGraphic fill={fill} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* water in front of the buoys: the lower they sink, the more they are tinted */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: skyH + 8, background: 'var(--tide-front)' }} />
              <Wave color="var(--tide-front)" top={skyH - 8} className="anim-drift-rev pointer-events-none" />

              {n === 0 && (
                <p className="absolute inset-x-0 text-center text-base font-semibold text-white" style={{ top: yFor(0.45) }}>
                  {t('tide.empty')}
                </p>
              )}
            </div>

            {/* LABELS: one per buoy, always readable on a plain surface */}
            <div className="grid px-0" style={cols}>
              {catches.map((c) => {
                const r = RISK[c.risk]
                const Icon = RISK_ICON[c.risk]
                const range = rangeText(c.hoursMin, c.hoursMax)
                return (
                  <Link
                    key={c.id}
                    to={`/catches/${c.id}`}
                    aria-label={t('a11y.catch', { species: c.species, kg: c.kg, risk: t(`risk.${c.risk}`), left: t('time.left', { range }) })}
                    className="flex min-h-12 flex-col items-center gap-1 rounded-sm px-1 py-3 text-center hover:bg-seafoam/50"
                  >
                    <span className="text-sm font-semibold leading-tight">{c.species}</span>
                    <span className="text-sm text-ink-soft">{c.kg} kg</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold ${r.text} ${r.bg} ${r.line}`}>
                      <Icon size={14} strokeWidth={1.8} aria-hidden />
                      {range}h
                    </span>
                  </Link>
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

        {header && <div className="absolute inset-x-0 top-0 z-20 p-4">{header}</div>}
      </div>

      <p className="simple-hide px-4 pb-3 pt-1 text-sm text-ink-soft">{t('tide.hint')}</p>
    </section>
  )
}