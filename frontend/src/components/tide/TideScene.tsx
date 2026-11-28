import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUp, Info } from 'lucide-react'
import { HORIZON_H, needsAttention, type Catch } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { RISK_ICON } from '../ui/RiskBadge'
import { useT } from '../../lib/i18n'
import { rangeText } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import dayImg from '../../assets/bg/buoy-day.webp'
import nightImg from '../../assets/bg/buoy-night.webp'

// Scene geometry (px). The sea is a fixed-height strip; each buoy sinks along TRAVEL as time runs out.
const SEABED = 34
const TRAVEL = 88
const LANE = 84

// Compact version (phone Home hero): a shorter sea so the catch strip sits higher on the screen.
const C_SKY = 92
const C_TRAVEL = 44
const C_SEABED = 18
const C_PAD = 8

// Narrow containers (phones) get their own layout: one full catch and a peek of the next, swiping sideways.
const PHONE_MAX = 560 // container width in px below which the scene swipes
const PHONE_LANE = 0.64 // each catch takes this share of the width, so the next one peeks in
const FLOAT_CY = 42 // y of the buoy's float centre inside its 44x68 drawing

// The picture is 2:1 and its horizon sits 49.49% down. It is placed so the horizon lands on the waterline (skyH).
const HORIZON = 0.4949
const IMG_W = 'max(100cqw, 600px)'

// 1 at the surface (24h+ left) ... 0 at the seabed (0h left), inverted to "how far it has sunk"
const sunk = (hours: number) => 1 - Math.min(Math.max(hours, 0), HORIZON_H) / HORIZON_H

// The seabed: sand dunes, a few pebbles and seaweed swaying, so the strip under the 0h line is ground and not an empty band.
const SAND = {
  day: { top: '#dcc08f', mid: '#c2a073', end: '#9c7d57', weed: '#2e9c7c', pebble: '#f1e4c8' },
  night: { top: '#1b4a63', mid: '#123b52', end: 'var(--color-card)', weed: '#3fc3b0', pebble: '#6f9db0' },
}
const WEEDS = [
  { left: '6%', h: 32 }, { left: '8%', h: 21 }, { left: '33%', h: 27 }, { left: '61%', h: 34 }, { left: '63%', h: 20 }, { left: '89%', h: 28 },
]
const PEBBLES = [{ left: '18%', b: 6, s: 6 }, { left: '47%', b: 9, s: 5 }, { left: '75%', b: 5, s: 7 }]

function Seabed({ top, night, compact }: { top: number; night: boolean; compact: boolean }) {
  const c = night ? SAND.night : SAND.day
  const k = compact ? 0.7 : 1
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ top, background: `linear-gradient(180deg, ${c.mid}, ${c.end})` }}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 50" preserveAspectRatio="none">
        <path d="M0 8Q40 2 80 7T160 6T240 8T320 5T400 7V50H0Z" fill={c.top} />
        <path d="M0 24Q60 17 120 23T240 22T400 24V50H0Z" fill={c.mid} opacity="0.85" />
      </svg>
      {PEBBLES.map((p, i) => (
        <span key={i} className="absolute rounded-full" style={{ left: p.left, bottom: p.b * k, width: p.s * k, height: p.s * k * 0.7, background: c.pebble, opacity: 0.8 }} />
      ))}
      {WEEDS.map((w, i) => {
        const h = Math.round(w.h * k)
        return (
          <svg key={i} width="10" height={h} viewBox={`0 0 10 ${h}`} className="anim-rock absolute" style={{ left: w.left, bottom: 3, '--rock': `${5 + (i % 3) * 2}deg`, transformOrigin: '50% 100%' } as CSSProperties}>
            <path d={`M5 ${h}C1 ${h * 0.7} 9 ${h * 0.4} 5 1`} fill="none" stroke={c.weed} strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        )
      })}
    </div>
  )
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

// flagFirst: phone hero only. Marks the catches that need attention with a small "Unahin" label.
// emptyAction: an optional button shown under the empty text.
type Props = { catches: Catch[]; header?: ReactNode; emptyText?: string; emptyAction?: ReactNode; compact?: boolean; flagFirst?: boolean }

export default function TideScene({ catches, header, emptyText, emptyAction, compact = false, flagFirst = false }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const { theme } = useSettings()
  const night = theme === 'night'
  const n = catches.length
  const skyH = compact ? (header ? C_SKY : 56) : header ? 140 : 64
  const travel = compact ? C_TRAVEL : TRAVEL
  const H = skyH + 6 + travel + (compact ? C_PAD : 20) + (compact ? C_SEABED : SEABED)
  const yFor = (u: number) => skyH + 6 + u * travel

  // Measure the section. In a narrow one, every catch gets a wide lane and the scene scrolls sideways with snapping.
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const read = () => setW(Math.round(el.getBoundingClientRect().width))
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const phone = w > 0 && w < PHONE_MAX
  const lane = phone ? Math.max(Math.round(w * PHONE_LANE), 176) : LANE
  // Only 3 or more catches swipe. One or two share the width evenly.
  const swipes = phone && n > 2 && n * lane > w
  const cols = {
    gridTemplateColumns: swipes ? `repeat(${n}, ${lane}px)` : `repeat(${Math.max(n, 1)}, minmax(${LANE}px, 1fr))`,
  }
  const snap = swipes ? 'snap-start' : ''

  // Buoys start at the surface and settle to their depth after the first paint
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Which buoy is highlighted (mouse hover or keyboard focus on its label). A tap opens the catch.
  const [active, setActive] = useState<number | null>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])
  const show = (i: number, autoHide = false) => {
    window.clearTimeout(hideTimer.current)
    setActive(i)
    if (autoHide) hideTimer.current = window.setTimeout(() => setActive(null), 4500)
  }
  const hide = (i: number) => setActive((a) => (a === i ? null : a))

  return (
    <section ref={box} aria-label={t('tide.hint')} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      <div className="relative">
        <div className={`overflow-x-auto ${swipes ? 'snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}>
          <div style={{ minWidth: swipes ? n * lane : Math.max(n, 1) * LANE }}>
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
              <Seabed top={yFor(1) - 2} night={night} compact={compact} />

              {/* BUOYS */}
              <div className="absolute inset-0 grid" style={cols}>
                {catches.map((c, i) => {
                  const mid = sunk((c.hoursMin + c.hoursMax) / 2)
                  const hi = sunk(c.hoursMin)
                  const cy = yFor(settled ? mid : 0)
                  const fill = RISK[c.risk].fill
                  const urgent = c.risk === 'high' || c.risk === 'critical'
                  const isActive = active === i
                  const move = `top 1.6s cubic-bezier(0.22, 0.9, 0.3, 1) ${i * 120}ms`
                  return (
                    <div key={c.id} className={`relative ${snap}`}>
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
                          onPointerEnter={(e) => { if (e.pointerType === 'mouse') show(i) }}
                          onPointerLeave={(e) => { if (e.pointerType === 'mouse') hide(i) }}
                          onClick={() => navigate(`/catches/${c.id}`)}
                          className="anim-bob pointer-events-auto block w-full cursor-pointer"
                          style={{ '--bob': `${3 * (1 - mid)}px`, animationDelay: `${i * 450}ms` } as CSSProperties}
                        >
                          <span className="block origin-bottom transition-transform duration-200" style={{ transform: isActive ? 'scale(1.12)' : undefined }}>
                            <BuoyGraphic fill={fill} />
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* water in front of the buoys: the lower they sink, the more they are tinted */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: skyH + 8, background: 'var(--tide-front)' }} />
              <WaveLine top={skyH + 56} dur={6} opacity={night ? 0.16 : 0.26} className="pointer-events-none" />

              {n === 0 && (
                <div className="absolute inset-x-0 flex flex-col items-center px-4 text-center" style={{ top: compact ? yFor(0.05) : yFor(0.45) }}>
                  <p className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{emptyText ?? t('tide.empty')}</p>
                  {emptyAction}
                </div>
              )}
            </div>

            {/* LABELS: one per buoy, always readable on a plain surface */}

            <div className="grid px-0" style={cols}>
              {catches.map((c, i) => {
                const r = RISK[c.risk]
                const Icon = c.risk === 'low' ? ArrowUp : RISK_ICON[c.risk]
                const range = rangeText(c.hoursMin, c.hoursMax)
                return (
                  <div key={c.id} className={`relative ${snap}`}>
                    {/* thin divider between catches */}
                    {i > 0 && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px bg-line" />}
                    <Link
                      to={`/catches/${c.id}`}
                      aria-label={t('a11y.catch', { species: c.species, kg: c.kg, risk: t(`risk.${c.risk}`), left: t('time.left', { range }) })}
                      onMouseEnter={() => show(i)}
                      onMouseLeave={() => hide(i)}
                      onFocus={() => show(i)}
                      onBlur={() => hide(i)}
                      className={`flex min-h-12 flex-col items-center gap-1 rounded-sm px-1 text-center hover:bg-seafoam/50 ${compact ? 'py-1.5' : 'py-2.5'}`}
                    >
                      {compact ? (
                        <>
                          {flagFirst && needsAttention(c) && (
                            <span className="rounded-full bg-cream px-2 py-1 text-xs font-bold leading-none text-deep">{t('home.first')}</span>
                          )}
                          <span className="max-w-full truncate text-base font-bold leading-tight">{c.species}</span>
                          <span className={`inline-flex items-baseline gap-1 whitespace-nowrap leading-tight tabular-nums ${r.text}`}>
                            <Icon size={13} strokeWidth={2.6} aria-hidden className="self-center" />
                            <span className="text-base font-bold">{range}</span>
                            <span className="text-xs font-medium text-ink-soft">{t('unit.hours')}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true" className="h-1 w-8 rounded-full" style={{ background: r.fill }} />
                          <span className="max-w-full truncate text-[15px] font-bold leading-tight">{c.species}</span>
                          <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm leading-tight">
                            <span className={`inline-flex items-center gap-1 whitespace-nowrap font-bold tabular-nums ${r.text}`}>
                              <Icon size={14} strokeWidth={2.6} aria-hidden />
                              {range}<span className="text-xs font-medium text-ink-soft">h</span>
                            </span>
                            <span className="whitespace-nowrap text-ink-soft">{c.kg} kg</span>
                          </span>
                        </>
                      )}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* depth scale: stays put while the scene scrolls. Left off the phone hero: each buoy carries its own estimate. */}
        {!compact && <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ height: H }} aria-hidden="true">
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
        </div>}

        {header && <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 [&_a]:pointer-events-auto">{header}</div>}
      </div>

      {/* the hint line is left out of the compact hero: the buoys and their labels already say it */}
      {(!compact || swipes) && (
        <p className="simple-hide flex items-center justify-center gap-2 border-t border-line px-4 py-3 text-sm font-medium text-teal">
          <Info size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
          {swipes ? t('tide.swipe') : t('tide.hint')}
        </p>
      )}
    </section>
  )
}