import { Link } from 'react-router-dom'
import { ChevronRight, CircleCheck, Cloud, CloudRain, CloudSun, Sun, TriangleAlert, type LucideIcon } from 'lucide-react'
import { sailLevel, type Forecast, type Level, type Sky } from '../../lib/weather'
import { useT } from '../../lib/i18n'

const SKY_ICON: Record<Sky, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
// Whole class strings on purpose, so Tailwind can see them
const LOOK: Record<Level, string> = {
  good: 'border-line bg-card text-risk-low',
  caution: 'border-risk-moderate-line bg-risk-moderate-bg text-risk-moderate',
  danger: 'border-risk-critical-line bg-risk-critical-bg text-risk-critical',
}

/* Phone: the sea in one tap-able row at the very top, because it decides whether anyone goes out.
   Calm: the temperature and "Calm seas". Not calm: the row turns amber or red and adds the one-line advice. */
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
      className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-rest transition active:scale-[0.99] lg:hidden ${LOOK[level]}`}
    >
      <SkyIcon size={30} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-teal" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight text-navy">
          {forecast.status === 'loading' ? '–' : temp}°C · {t(`sky.${today.sky}`)}
        </span>
        {live && (
          <span className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold leading-snug">
            <StatusIcon size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{level === 'good' ? t('home.adv.title.good') : `${t('home.adv.title')}. ${t(`home.adv.${level}`)}`}</span>
          </span>
        )}
      </span>
      <ChevronRight size={22} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-ink-soft" />
    </Link>
  )
}