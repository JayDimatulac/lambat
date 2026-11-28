import { Link } from 'react-router-dom'
import { CircleCheck, Cloud, CloudRain, CloudSun, Sun, TriangleAlert, type LucideIcon } from 'lucide-react'
import { sailLevel, type Forecast, type Level, type Sky } from '../../lib/weather'
import { useT } from '../../lib/i18n'

const SKY_ICON: Record<Sky, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
// Whole class strings on purpose, so Tailwind can see them
const LOOK: Record<Level, string> = {
  good: 'border-line bg-linear-to-br from-seafoam/70 to-card text-risk-low',
  caution: 'border-risk-moderate-line bg-risk-moderate-bg text-risk-moderate',
  danger: 'border-risk-critical-line bg-risk-critical-bg text-risk-critical',
}
// The signal flag a harbour would fly: green calm, yellow careful, red stay in port
const FLAG: Record<Level, string> = { good: '#3db86b', caution: '#f2c230', danger: '#e5484d' }

/* Phone: the sea in one tap-able card at the very top, because it decides whether anyone goes out.
   The big number is the temperature, the flag on the right is the sea's signal, and a thin wave runs along the bottom.
   Not calm: the card turns amber or red and says one short phrase. */
export default function SeaStatus({ forecast }: { forecast: Forecast }) {
  const t = useT()
  const today = forecast.week[0]
  const temp = forecast.now?.temp ?? today.tMax
  const live = forecast.status === 'live'
  const level: Level = live ? sailLevel(today.wind, today.gust, today.wave, today.rain) : 'good'
  const SkyIcon = SKY_ICON[today.sky]
  const StatusIcon = level === 'good' ? CircleCheck : TriangleAlert

  return (
    <Link
      to="/weather"
      aria-label={t('home.wx.title')}
      className={`relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 shadow-rest transition active:scale-[0.99] lg:hidden ${LOOK[level]}`}
    >
      {/* two soft waves along the bottom edge */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 w-full text-teal" viewBox="0 0 200 24" preserveAspectRatio="none">
        <path d="M0 12q12.5-9 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0V24H0Z" fill="currentColor" opacity="0.1" />
        <path d="M0 17q12.5-7 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0V24H0Z" fill="currentColor" opacity="0.1" />
      </svg>

      <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-card/80 text-teal shadow-rest">
        <SkyIcon size={28} strokeWidth={1.6} aria-hidden="true" />
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="font-numeral text-3xl font-bold leading-none text-navy">{forecast.status === 'loading' ? '–' : temp}°</span>
          <span className="truncate text-sm font-medium text-ink-soft">{t(`sky.${today.sky}`)}</span>
        </span>
        {live && (
          <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold leading-snug">
            <StatusIcon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span>{level === 'good' ? t('home.adv.title.good') : t(`home.sea.${level}`)}</span>
          </span>
        )}
      </span>

      {/* the signal flag: it flutters on its pole */}
      <svg aria-hidden="true" width="34" height="42" viewBox="0 0 34 42" className="relative shrink-0">
        <path d="M7 3V40" stroke="var(--color-navy)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <g className="anim-flutter" style={{ transformOrigin: '7px 12px', transformBox: 'view-box' }}>
          <path d="M7 5C14 2 20 8 30 5V18C20 21 14 15 7 18Z" fill={FLAG[level]} stroke="var(--color-navy)" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      </svg>
    </Link>
  )
}