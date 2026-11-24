import { Link } from 'react-router-dom'
import { ChevronRight, CircleCheck, Cloud, CloudRain, CloudSun, Sun, TriangleAlert, type LucideIcon } from 'lucide-react'
import { sailLevel, type Forecast, type Level, type Sky } from '../../lib/weather'
import { useT } from '../../lib/i18n'

const SKY_ICON: Record<Sky, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
// Whole class strings on purpose, so Tailwind can see them
const TONE: Record<Level, string> = { good: 'text-risk-low', caution: 'text-risk-moderate', danger: 'text-risk-critical' }

// Phone: a short Panahon card. A tap opens the full forecast (wind, waves, humidity).
export default function WeatherStrip({ forecast }: { forecast: Forecast }) {
  const t = useT()
  const today = forecast.week[0]
  const temp = forecast.now?.temp ?? today.tMax
  const loading = forecast.status === 'loading'
  const live = forecast.status === 'live'
  const level = sailLevel(today.wind, today.gust, today.wave, today.rain)
  const SkyIcon = SKY_ICON[today.sky]
  const StatusIcon = level === 'good' ? CircleCheck : TriangleAlert

  return (
    <Link
      to="/weather"
      aria-label={t('home.wx.title')}
      className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-rest transition active:scale-[0.99] lg:hidden"
    >
      <SkyIcon size={34} strokeWidth={1.6} className="shrink-0 text-teal" aria-hidden="true" />
      <span aria-hidden="true" className="h-12 w-px shrink-0 bg-line" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-ink-soft">{t('nav.weather')}</span>
        <span className="block text-base font-semibold leading-tight">
          {loading ? '–' : temp}°C · {t(`sky.${today.sky}`)}
        </span>
        {live && (
          <span className={`mt-0.5 flex items-center gap-1 text-sm font-medium ${TONE[level]}`}>
            <StatusIcon size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{level === 'good' ? t('home.adv.title.good') : t('home.adv.title')}</span>
          </span>
        )}
      </span>
      <ChevronRight size={22} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-ink-soft" />
    </Link>
  )
}
