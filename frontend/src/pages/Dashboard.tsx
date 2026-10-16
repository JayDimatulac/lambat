import { Fragment, useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import TideScene from '../components/tide/TideScene'
import Disclaimer from '../components/ui/Disclaimer'
import { RISK_ICON } from '../components/ui/RiskBadge'
import { KnotPlusIcon } from '../components/icons'
import { byUrgency, isActive, user, weekBase, type Outcome } from '../data/mock'
import { useCatches } from '../data/store'
import { RISK } from '../lib/risk'
import { localeOf, sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

// Change this to your port, barangay or city
const PLACE = 'Cebu City'

/* ---------- Hand-drawn LAMBAT icon set (stroke icons, 32 grid) ---------- */

const FISH = 'M2 19 C6 12 13 10 19 14 L24 10 V26 L19 22 C13 26 6 24 2 19 Z'
const ROPE = 'repeating-linear-gradient(115deg, rgba(255,255,255,.28) 0 3px, transparent 3px 9px)'

type IconProps = { size?: number; className?: string }

function Svg({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** A plain fish: the app's signature mark */
function FishGlyph(p: IconProps) {
  return (
    <Svg {...p}>
      <path d={FISH} />
      <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** Naibenta: fish with a coin */
function SoldFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g transform="translate(0 3)">
        <path d={FISH} />
        <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
      </g>
      <circle cx="25" cy="7" r="4.5" />
      <path d="M23.2 7h3.6" />
    </Svg>
  )
}

/** Naipamahagi: fish in a basket (bilao) */
function SharedFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g transform="translate(0 -4)">
        <path d={FISH} />
        <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
      </g>
      <path d="M4 24H28L25 29H7Z" />
      <path d="M13 24V29M19 24V29" />
    </Svg>
  )
}

/** Nasayang: a fish skeleton */
function LostFishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 13L8 16L3 19Z" />
      <path d="M8 16H24" />
      <path d="M12 16L10 11M12 16L10 21M16 16L14 10M16 16L14 22M20 16L18 11M20 16L18 21" />
      <path d="M24 16L29 11M24 16L29 21" />
    </Svg>
  )
}

/** Location: a marker buoy riding the water */
function BuoyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 3V8" />
      <path d="M10 9H22L25 22H7Z" />
      <path d="M8.6 15.5H23.4" />
      <path d="M3 27q3.5-3 7 0t7 0t7 0t5 0" />
    </Svg>
  )
}

/** Wind: a flag snapping in the breeze */
function PennantIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 4V28" />
      <path d="M6 6C12 3 18 9 26 6V16C18 19 12 13 6 16" />
    </Svg>
  )
}

/** Arrow whose shaft is a wave */
function WaveArrow(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 16q3-4 6 0t6 0t6 0t6 0" />
      <path d="M21 9L28 16L21 23" />
    </Svg>
  )
}

/** Paalala: a lighthouse (guidance, not certification) */
function LighthouseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M11 28L13 13H19L21 28Z" />
      <path d="M12 13V8H20V13" />
      <path d="M12 8L16 3L20 8" />
      <path d="M3 10H8M24 10H29M4.5 5.5L8 8M27.5 5.5L24 8" />
      <path d="M12.4 20H19.6" />
    </Svg>
  )
}

/** A wavy underline for section titles */
function WaveRule() {
  return (
    <svg viewBox="0 0 120 8" width="96" height="7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal" aria-hidden>
      <path d="M2 4q7.5-6 15 0t15 0t15 0t15 0t15 0t15 0t15 0t15 0" />
    </svg>
  )
}

/** A test-tube of water: the fuller it is, the fresher the catch */
function FreshGauge({ level, className = '' }: { level: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const y = 4 + 76 * (1 - level)
  return (
    <svg viewBox="0 0 36 84" width="36" height="84" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <rect x="4" y="4" width="28" height="76" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g style={{ transform: `translateY(${y}px)` }}>
          <g className="anim-drift">
            <path
              d="M0 0 q7.5 -5 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 V100 H0 Z"
              fill="currentColor"
              fillOpacity="0.85"
            />
          </g>
        </g>
      </g>
      <rect x="4" y="4" width="28" height="76" rx="14" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
      <path d="M32 24h-5M32 42h-5M32 60h-5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ---------- The page ---------- */

export default function Dashboard() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const now = new Date()
  const hour = now.getHours()
  const greet = hour < 12 ? t('greet.morning') : hour < 18 ? t('greet.afternoon') : t('greet.evening')
  const date = now.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })

  const active = catches.filter(isActive).sort(byUrgency)
  const urgent = active.filter((c) => c.risk === 'high' || c.risk === 'critical').slice(0, 2)

  const sum = (o: Outcome) => {
    const closed = catches.filter((c) => c.outcome === o)
    return { n: weekBase[o].n + closed.length, kg: weekBase[o].kg + closed.reduce((total, c) => total + c.kg, 0) }
  }
  const sold = sum('sold')
  const shared = sum('shared')
  const lost = sum('lost')
  const totalKg = Math.max(1, sold.kg + shared.kg + lost.kg)
  const pct = Math.round(((sold.kg + shared.kg) / totalKg) * 100)

  const tally = [
    { key: 'sold', n: sold.n, kg: sold.kg, Glyph: SoldFishIcon, text: 'text-teal', bar: 'bg-teal', top: 'border-t-teal' },
    { key: 'shared', n: shared.n, kg: shared.kg, Glyph: SharedFishIcon, text: 'text-coral', bar: 'bg-coral', top: 'border-t-coral' },
    { key: 'lost', n: lost.n, kg: lost.kg, Glyph: LostFishIcon, text: 'text-ink-soft', bar: 'bg-ink-soft', top: 'border-t-ink-soft' },
  ] as const

  const header = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="pt-2">
          <p className="text-sm font-medium text-white">{date}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-white/85">
            <BuoyIcon size={16} />
            {PLACE}
          </p>
        </div>
        <Link to="/weather" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-deep/40 px-3.5 text-sm font-semibold text-white">
          <PennantIcon size={18} />
          {t('home.wind')}
        </Link>
      </div>
      <p className="mt-1 font-numeral text-[24px] font-bold leading-tight text-white">
        {greet}, {user.name}
      </p>
    </>
  )

  return (
    <div className="space-y-7">
      {/* 1. THE HERO */}
      <TideScene catches={active.slice(0, 4)} header={header} />

      {/* 2. THE ONE PRIMARY ACTION */}
      <Link
        to="/catches/new"
        className="relative flex min-h-[108px] items-center gap-4 overflow-hidden rounded-lg bg-coral px-5 py-4 text-deep shadow-raised transition active:scale-[0.98]"
      >
        <span className="scales absolute inset-0" aria-hidden />
        <svg viewBox="0 0 32 32" className="absolute -bottom-4 right-12 size-28 -rotate-12 fill-deep/10" aria-hidden>
          <path d={FISH} />
        </svg>
        <span className="relative grid size-16 shrink-0 place-items-center rounded-full bg-cream shadow-raised ring-4 ring-deep/10">
          <span className="anim-ripple absolute inset-0 rounded-full border-2 border-deep/30" aria-hidden />
          <KnotPlusIcon size={32} />
        </span>
        <span className="relative flex-1">
          <span className="block font-numeral text-[26px] font-bold leading-none">{t('home.log')}</span>
          <span className="simple-hide mt-1.5 block text-sm font-medium">{t('home.log.sub')}</span>
        </span>
        <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-deep text-cream">
          <WaveArrow size={24} />
        </span>
      </Link>

      {/* 3. NEEDS ACTION */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-numeral text-2xl font-bold leading-none">{t('home.actions')}</h2>
            <div className="mt-2">
              <WaveRule />
            </div>
          </div>
          {urgent.length > 0 && (
            <span className="grid size-8 place-items-center rounded-full bg-navy font-numeral text-base font-bold text-on-accent">
              {urgent.length}
            </span>
          )}
        </div>

        {urgent.length === 0 ? (
          <p className="flex items-center gap-3 rounded-lg border border-line bg-card p-4 text-ink-soft shadow-rest">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal/15 text-teal">
              <FishGlyph size={28} />
            </span>
            {t('home.calm')}
          </p>
        ) : (
          <ul className="space-y-3">
            {urgent.map((c) => {
              const r = RISK[c.risk]
              const Icon = RISK_ICON[c.risk]
              const hrs = Math.max(1, Math.round(Number(c.hoursMin)))
              const level = Math.min(1, Math.max(0.12, hrs / 24))
              return (
                <li key={c.id} className={`relative overflow-hidden rounded-lg border bg-card shadow-rest ${r.line}`}>
                  <div className="flex items-center gap-4 p-4">
                    <FreshGauge level={level} className={`shrink-0 ${r.text}`} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/catches/${c.id}`} className="block font-numeral text-xl font-bold leading-tight after:absolute after:inset-0">
                        {c.species}
                      </Link>
                      <span className="mt-1.5 inline-block rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold">{c.kg} kg</span>
                      <p className="mt-1.5 text-sm leading-snug text-ink-soft">{sellByText(c.hoursMin, lang, t)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`mb-1 inline-grid size-7 place-items-center rounded-full ${r.bg} ${r.text}`}>
                        <Icon size={15} strokeWidth={2} aria-hidden />
                      </span>
                      <p className={`font-numeral text-5xl font-extrabold leading-none ${r.text}`}>
                        {hrs}
                        <span className="text-xl">h</span>
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <Link
                      to={`/buyers?catch=${c.id}`}
                      className="relative z-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-on-accent transition active:scale-[0.98]"
                    >
                      {t('home.findbuyer')}
                      <WaveArrow size={22} />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex items-start gap-3 rounded-md border border-dashed border-teal/50 bg-seafoam/50 px-3.5 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-teal shadow-rest">
            <LighthouseIcon size={24} />
          </span>
          <div className="pt-0.5 text-[13px] leading-snug text-navy [&_*]:not-italic! [&_*]:text-navy!">
            <Disclaimer />
          </div>
        </div>
      </section>

      {/* 4. THIS WEEK: THE LUBID (ROPE) */}
      <section className="overflow-hidden rounded-lg border border-line bg-card p-5 shadow-rest">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{t('home.week')}</p>
        <div className="mt-2 flex items-end gap-4">
          <p className="font-numeral text-[84px] font-extrabold leading-[0.8] text-teal">
            {pct}
            <span className="text-4xl">%</span>
          </p>
          <p className="pb-1 text-sm font-medium leading-snug">{t('tally.summary', { pct })}</p>
        </div>

        <div className="mt-6 flex h-5 items-center" role="img" aria-label={t('tally.summary', { pct })}>
          {tally.map((row, i) => (
            <Fragment key={row.key}>
              {i > 0 && <span className="relative z-10 -mx-2.5 size-5 shrink-0 rounded-full border-[3px] border-card bg-navy" aria-hidden />}
              <span className={`h-full rounded-full ${row.bar}`} style={{ width: `${(row.kg / totalKg) * 100}%`, backgroundImage: ROPE }} />
            </Fragment>
          ))}
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2.5">
          {tally.map(({ key, n, kg, Glyph, text, top }) => (
            <li key={key} className={`rounded-md border border-line border-t-4 bg-mint/60 px-2.5 pb-3 pt-3 ${top}`}>
              <Glyph size={34} className={text} />
              <p className="mt-2 font-numeral text-4xl font-extrabold leading-none">{n}</p>
              <p className="mt-1.5 break-words text-xs font-bold leading-tight">{t(`tally.${key}`)}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-soft">{Math.round(kg)} kg</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}