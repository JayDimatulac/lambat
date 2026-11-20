import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUp, Info } from 'lucide-react'
import { HORIZON_H, type Catch } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { RISK_ICON } from '../ui/RiskBadge'
import { useT } from '../../lib/i18n'
import { rangeText } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import dayImg from '../../assets/bg/buoy-day.png'
import nightImg from '../../assets/bg/buoy-night.png'

// Scene geometry (px). The sea is a fixed-height strip; each buoy sinks along TRAVEL as time runs out.
const SEABED = 34
const TRAVEL = 88
const LANE = 84
const FLOAT_CY = 42 // y of the buoy's float centre inside its 44x68 drawing

// The picture is 2:1 and its horizon sits 49.49% down. It is placed so the horizon lands on the waterline (skyH).
const HORIZON = 0.4949
const IMG_W = 'max(100cqw, 600px)'

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

type Props = { catches: Catch[]; header?: ReactNode }

export default function TideScene({ catches, header }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const { theme } = useSettings()
  const night = theme === 'night'
  const n = catches.length
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

  // Which buoy shows its card. Mouse: hover. Touch: first tap shows the card, second tap opens the catch.
  const [active, setActive] = useState<number | null>(null)
  const lastPointer = useRef('mouse')
  const hideTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])
  const show = (i: number, autoHide = false) => {
    window.clearTimeout(hideTimer.current)
    setActive(i)
    if (autoHide) hideTimer.current = window.setTimeout(() => setActive(null), 4500)
  }
  const hide = (i: number) => setActive((a) => (a === i ? null : a))

  return (
    <section aria-label={t('tide.hint')} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      <div className="relative">
        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(n, 1) * LANE }}>
            {/* THE SCENE */}
            <div className="relative overflow-hidden" style={{ height: H, containerType: 'inline-size', background: night ? '#001335' : '#015672' }}>
              {/* BACKGROUND: sky, mountains, sun or moon and the sea, as one picture. Buoys and waves are drawn on top. */}
              <img
                src={night ? nightImg : dayImg}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{ width: IMG_W, left: '50%', transform: 'translateX(-50%)', top: `calc(${skyH}px - ${(HORIZON / 2).toFixed(5)} * ${IMG_W})` }}
              />
              <WaveLine top={skyH + 26} dur={8} opacity={night ? 0.22 : 0.3} />
              <div className="absolute inset-x-0 bottom-0 h-10 border-t-2 border-dashed border-white/30" style={{ background: 'var(--tide-seabed)' }} />

              {/* BUOYS */}
              <div className="absolute inset-0 grid" style={cols}>
                {catches.map((c, i) => {
                  const mid = sunk((c.hoursMin + c.hoursMax) / 2)
                  const hi = sunk(c.hoursMin)
                  const cy = yFor(settled ? mid : 0)
                  const fill = RISK[c.risk].fill
                  const urgent = c.risk === 'high' || c.risk === 'critical'
                  const r = RISK[c.risk]
                  const RiskIcon = RISK_ICON[c.risk]
                  const range = rangeText(c.hoursMin, c.hoursMax)
                  const isActive = active === i
                  const above = cy - FLOAT_CY - 96 > 4 // flip the card below the buoy when there is no room above
                  const justify = n > 1 && i === 0 ? 'justify-start' : n > 1 && i === n - 1 ? 'justify-end' : 'justify-center'
                  const move = `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`
                  return (
                    <div key={c.id} className="relative">
                      {/* the rope hangs from the buoy down to the earliest it could sink: its length shows the uncertainty */}
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
                      {urgent && (
                        <div className="absolute left-1/2 size-14 -translate-x-1/2" style={{ top: cy - 28, transition: move }}>
                          <span className="anim-ripple block size-full rounded-full border-2" style={{ borderColor: fill }} />
                        </div>
                      )}
                      <div className="absolute left-1/2 w-14 -translate-x-1/2" style={{ top: cy - FLOAT_CY, transition: move, zIndex: isActive ? 20 : undefined }}>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-hidden="true"
                          onPointerDown={(e) => { lastPointer.current = e.pointerType }}
                          onPointerEnter={(e) => { if (e.pointerType === 'mouse') show(i) }}
                          onPointerLeave={(e) => { if (e.pointerType === 'mouse') hide(i) }}
                          onClick={() => {
                            if (lastPointer.current === 'touch' && active !== i) show(i, true)
                            else navigate(`/catches/${c.id}`)
                          }}
                          className="anim-bob pointer-events-auto block w-full cursor-pointer"
                          style={{ '--bob': `${3 * (1 - mid)}px`, animationDelay: `${i * 450}ms` } as CSSProperties}
                        >
                          <span className="block origin-bottom transition-transform duration-200" style={{ transform: isActive ? 'scale(1.12)' : undefined }}>
                            <BuoyGraphic fill={fill} />
                          </span>
                        </button>
                      </div>

                      {/* the card: species, quantity, risk and time left. Hover or tap a buoy to see it, click to open the catch. */}
                      {isActive && (
                        <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-30 flex px-1 ${justify}`} style={{ top: above ? cy - FLOAT_CY - 8 : cy + 26 }}>
                          <div className={`w-44 rounded-md border border-line bg-card p-2.5 text-navy shadow-raised ${above ? '-translate-y-full' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-numeral text-base font-bold leading-tight">{c.species}</p>
                              <ArrowRight size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-teal" />
                            </div>
                            <p className="mt-0.5 text-sm text-ink-soft">{c.kg} kg</p>
                            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border-[1.5px] px-2 py-0.5 text-xs font-bold ${r.text} ${r.bg} ${r.line}`}>
                              <RiskIcon size={13} strokeWidth={2.4} />
                              {t(`risk.${c.risk}`)}
                            </span>
                            <p className="mt-1.5 text-sm font-semibold">{t('time.left', { range })}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* water in front of the buoys: the lower they sink, the more they are tinted */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: skyH + 8, background: 'var(--tide-front)' }} />
              <WaveLine top={skyH + 56} dur={6} opacity={night ? 0.16 : 0.26} className="pointer-events-none" />

              {n === 0 && (
                <p className="absolute inset-x-0 text-center text-base font-semibold text-white" style={{ top: yFor(0.45) }}>
                  {t('tide.empty')}
                </p>
              )}
            </div>

            {/* LABELS: one per buoy, always readable on a plain surface */}
            <div className="grid px-0" style={cols}>
              {catches.map((c, i) => {
                const r = RISK[c.risk]
                const Icon = c.risk === 'low' ? ArrowUp : RISK_ICON[c.risk]
                const range = rangeText(c.hoursMin, c.hoursMax)
                return (
                  <div key={c.id} className="relative">
                    {/* thin divider between catches */}
                    {i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-line" />}
                    <Link
                      to={`/catches/${c.id}`}
                      aria-label={t('a11y.catch', { species: c.species, kg: c.kg, risk: t(`risk.${c.risk}`), left: t('time.left', { range }) })}
                      onMouseEnter={() => show(i)}
                      onMouseLeave={() => hide(i)}
                      onFocus={() => show(i)}
                      onBlur={() => hide(i)}
                      className="flex min-h-12 flex-col items-center gap-1 rounded-sm px-1 py-3 text-center hover:bg-seafoam/50"
                    >
                      <span className="text-base font-bold leading-tight">{c.species}</span>
                      <span className="text-sm text-ink-soft">{c.kg} kg</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-3 py-1 text-sm font-bold ${r.text} ${r.bg} ${r.line}`}>
                        <Icon size={14} strokeWidth={2.4} aria-hidden />
                        {range}h
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
        {t('tide.hint')}
      </p>
    </section>
  )
}