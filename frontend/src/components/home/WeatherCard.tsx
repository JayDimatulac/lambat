import { Link } from 'react-router-dom'
import { ArrowRight, CircleCheck, Cloud, CloudRain, CloudSun, Droplet, Sun, TriangleAlert, Waves, Wind, type LucideIcon } from 'lucide-react'
import WeatherLayers from '../weather/WeatherLayers'
import dayImg from '../../assets/bg/weather-day.webp'
import nightImg from '../../assets/bg/weather-night.webp'
import { compass, sailLevel, type Forecast, type Level, type Sky } from '../../lib/weather'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

const SKY_ICON: Record<Sky, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }

// Whole class strings on purpose, so Tailwind can see them
const ADVISORY: Record<Level, { box: string; title: string }> = {
  good: { box: 'border-risk-low-line/70', title: 'text-risk-low' },
  caution: { box: 'border-risk-moderate-line/80', title: 'text-risk-moderate' },
  danger: { box: 'border-risk-critical-line/80', title: 'text-risk-critical' },
}

const dash = '–'

export default function WeatherCard({ forecast }: { forecast: Forecast }) {
  const t = useT()
  const { theme } = useSettings()
  const night = theme === 'night'
  const today = forecast.week[0]
  const now = forecast.now
  const live = forecast.status === 'live'

  // Right-now numbers when the forecast has them, today's numbers when it does not
  const temp = now?.temp ?? today.tMax
  const wind = now?.wind ?? today.wind
  const wave = now?.wave ?? today.wave
  const humidity = now?.humidity
  const dir = now?.windDir !== undefined ? ` ${compass(now.windDir)}` : ''
  const rain = today.rain
  const image = night ? nightImg : dayImg
  // If the image file is missing, the gradient shows instead
  const fallback = night
    ? 'linear-gradient(180deg, #0a2f3c 0%, #0d525e 55%, #05171e 100%)'
    : 'linear-gradient(180deg, #8fd3e3 0%, #d6eff1 55%, #3a9bab 100%)'
  const level = sailLevel(today.wind, today.gust, today.wave, today.rain)
  const SkyIcon = SKY_ICON[today.sky]
  const ink = night ? 'text-white' : 'text-deep'

  const stats: { Icon: LucideIcon; label: string; value: string }[] = [
    { Icon: Wind, label: t('home.wx.wind'), value: `${wind} km/h${dir}` },
    { Icon: Waves, label: t('home.wx.waves'), value: `${wave} m` },
    { Icon: Droplet, label: t('home.wx.humidity'), value: humidity !== undefined ? `${humidity}%` : dash },
  ]

  return (
    <section aria-label={t('home.wx.title')} className="relative isolate flex flex-1 flex-col overflow-hidden rounded-lg border border-white/10 shadow-raised">
      {/* the picture and the forecast's layers on it, sized and placed like background-size: cover so they line up.
          The card is tall and narrow, so only a slice shows: 70% 100% = a bit right of centre, bottom edge.
          Change --px and --py if the lantern gets cropped. */}
      <div aria-hidden="true" className="absolute inset-0 [--px:70%] [--py:100%]" style={{ containerType: 'size', background: fallback }}>
        <div
          className="absolute"
          style={{
            width: 'max(104cqw, calc(104cqh * 1.78774))',
            aspectRatio: '1677 / 938',
            left: 'var(--px)',
            top: 'var(--py)',
            transform: 'translate(calc(var(--px) * -1), calc(var(--py) * -1))',
          }}
        >
          <img src={image} alt="" draggable={false} className="size-full select-none" />
          <WeatherLayers night={night} sky={today.sky} wind={wind} wave={wave} rain={rain} windDir={now?.windDir} />
        </div>
      </div>
      {/* keeps the text readable on top of the picture */}
      <div aria-hidden="true" className={`absolute inset-0 ${night ? 'bg-linear-to-b from-deep/60 via-deep/25 to-transparent' : 'bg-linear-to-b from-white/60 via-white/25 to-transparent'}`} />

      <div className="relative flex items-center justify-between gap-2 px-4 pt-4">
        <h2 className={`flex items-center gap-2 font-numeral text-lg font-bold ${ink}`}>
          <SkyIcon size={30} strokeWidth={1.8} className={night ? 'text-peach' : 'text-coral'} aria-hidden="true" />
          {t('home.wx.title')}
        </h2>
        <Link
          to="/weather"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-deep/85 px-3.5 text-sm font-semibold text-white transition active:scale-[0.97]"
        >
          {t('home.wx.details')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="relative mt-4 flex items-center gap-4 px-4">
        <div className="shrink-0">
          <p className={`font-numeral text-[56px] font-bold leading-none ${ink}`}>
            {forecast.status === 'loading' ? dash : temp}
            <span className="align-top text-3xl">°C</span>
          </p>
          <p className={`mt-1 font-numeral text-lg font-bold ${ink}`}>{t(`sky.${today.sky}`)}</p>
        </div>
        <span aria-hidden="true" className={`h-16 w-px shrink-0 ${night ? 'bg-white/30' : 'bg-deep/25'}`} />
        <ul className={`min-w-0 flex-1 space-y-1.5 text-sm font-medium ${ink}`}>
          {stats.map(({ Icon, label, value }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon size={18} strokeWidth={1.8} className={night ? 'text-peach' : 'text-teal'} aria-hidden="true" />
              <span className="truncate">
                {label}: {forecast.status === 'loading' ? dash : value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* open space so the picture (sea, boat, lantern) shows */}
      <div aria-hidden="true" className="relative min-h-24 flex-1" />

      {live && (
        <div className="relative px-3 pb-3">
          <div className={`flex items-center gap-3 rounded-xl border bg-card/95 px-3 py-2.5 shadow-rest ${ADVISORY[level].box}`}>
            {level === 'good' ? <CircleCheck size={30} strokeWidth={1.8} className={`shrink-0 ${ADVISORY[level].title}`} aria-hidden="true" /> : <TriangleAlert size={30} strokeWidth={1.8} className={`shrink-0 ${ADVISORY[level].title}`} aria-hidden="true" />}
            <div className="min-w-0">
              <p className={`font-numeral text-sm font-bold leading-tight ${ADVISORY[level].title}`}>{level === 'good' ? t('home.adv.title.good') : t('home.adv.title')}</p>
              <p className="mt-0.5 text-xs font-medium leading-snug text-navy">{t(`home.adv.${level}`)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}