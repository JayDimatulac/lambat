import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import CalmSky from '../components/weather/CalmSky'
import DayRibbon from '../components/weather/DayRibbon'
import WeekStrip from '../components/weather/WeekStrip'
import DryRack from '../components/weather/DryRack'
import { WaveArrow } from '../components/home/HomeIcons'
import { WEATHER_IS_LIVE, calmWindow, dryScore, hour12, sailLevel, todayHours, weekFrom, windWindow, type Level, type Sky } from '../lib/weather'
import { localeOf } from '../lib/time'
import { useT, type Key } from '../lib/i18n'
import { useSettings } from '../lib/settings'

const SKY_WORD: Record<Sky, Key> = { sun: 'sky.sun', partly: 'sky.partly', cloud: 'sky.cloud', rain: 'sky.rain' }
const LEVEL: Record<Level, { word: Key; why: Key; dot: string }> = {
  good: { word: 'level.good', why: 'wx.why.good', dot: 'bg-risk-low-line' },
  caution: { word: 'level.caution', why: 'wx.why.caution', dot: 'bg-risk-moderate-line' },
  danger: { word: 'level.danger', why: 'wx.why.danger', dot: 'bg-risk-critical-line' },
}

export default function Weather() {
  const t = useT()
  const { lang } = useSettings()
  const [now] = useState(() => new Date())
  const week = useMemo(() => weekFrom(now), [now])
  const hours = useMemo(() => todayHours(), [])
  const [sel, setSel] = useState(0)

  const day = week[sel]
  const level = sailLevel(day.wind, day.gust, day.wave, day.rain)
  const L = LEVEL[level]
  const hour = sel === 0 ? Math.min(23, Math.max(0, now.getHours())) : 12
  const strong = sel === 0 ? windWindow(hours) : null
  const calm = sel === 0 ? calmWindow(hours) : null
  const score = dryScore(day)
  const best = week.reduce((b, d, i) => (dryScore(d) > dryScore(week[b]) ? i : b), 0)
  const dayName = (i: number) => week[i].date.toLocaleDateString(localeOf(lang), { weekday: 'long' })

  const dark = hour < 5 || hour >= 16 // night and dusk skies are dark, so the words on them turn light
  const ink = dark ? 'text-white' : 'text-deep'
  const glass = dark ? 'bg-white/15 text-white' : 'bg-white/70 text-deep'

  const stats = [
    { label: t('wx.stat.temp'), value: `${day.tMin}° – ${day.tMax}°` },
    { label: t('wx.stat.wind'), value: `${day.wind} km/h` },
    { label: t('wx.wave'), value: `${day.wave} m` },
    { label: t('wx.stat.rain'), value: `${day.rain}%` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{t('nav.weather')}</h1>

      {/* ONE CALM ANSWER: is it good to go out? */}
      <section className="relative isolate h-[22rem] overflow-hidden rounded-lg shadow-raised sm:h-[24rem]">
        <CalmSky day={day} hour={hour} />
        <div className={`relative z-10 flex h-full max-w-[17rem] flex-col justify-start gap-3 p-6 sm:max-w-md sm:p-8 ${ink}`}>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="font-numeral text-lg font-bold">{day.tMax}°</span>
            <span aria-hidden="true">·</span>
            {t(SKY_WORD[day.sky])}
            {!WEATHER_IS_LIVE && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${glass}`}>{t('ui.sample')}</span>}
          </p>
          <h2 className="flex items-center gap-3 font-display text-[34px] font-semibold leading-[1.1] sm:text-[42px]">
            <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-full ${L.dot}`} />
            {t(L.word)}
          </h2>
          <p className="text-base leading-snug">
            {t(L.why)}
            {strong && ` ${t('wx.window', { from: hour12(strong.from), to: hour12(strong.to) })}`}
          </p>
          {calm && (
            <p className={`mt-1 w-fit rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm ${glass}`}>
              {t('wx.best')}: {hour12(calm.from)} – {hour12(calm.to)}
            </p>
          )}
        </div>
      </section>

      {/* THE WEEK: tap a day to see it above */}
      <WeekStrip week={week} selected={sel} onSelect={setSel} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* TODAY, HOUR BY HOUR */}
        {sel === 0 ? (
          <DayRibbon hours={hours} nowHour={hour} />
        ) : (
          <section className="space-y-3 rounded-lg border border-dashed border-line bg-card p-5">
            <h2 className="text-xl">{dayName(sel)}</h2>
            <p className="text-ink-soft">{t('wx.hourly.today')}</p>
            <button type="button" onClick={() => setSel(0)} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">
              {t('wx.back')}
              <WaveArrow size={20} />
            </button>
          </section>
        )}

        <div className="space-y-6">
          {/* THE NUMBERS, tucked away until you want them */}
          <details className="group rounded-lg border border-line bg-card shadow-rest">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-xl font-semibold [&::-webkit-details-marker]:hidden">
              <span className="font-display">{t('wx.more')}</span>
              <ChevronDown size={22} strokeWidth={1.8} aria-hidden className="text-teal transition group-open:rotate-180" />
            </summary>
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-md bg-mint px-4 py-3">
                  <dt className="text-sm text-ink-soft">{s.label}</dt>
                  <dd className="mt-0.5 font-numeral text-xl font-bold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </details>

          {/* DRYING */}
          <section className="space-y-3 rounded-lg border border-line bg-card p-5 shadow-rest">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl">{t('wx.dry')}</h2>
                <p className="mt-1 text-sm font-semibold text-teal">{t('wx.dry.score', { n: score })}</p>
              </div>
              <DryRack score={score} />
            </div>
            <p className="text-sm leading-snug text-ink-soft">{t('wx.dry.best', { day: dayName(best) })}</p>
            <Link to="/value-added" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal hover:underline">
              {t('wx.dry.cta')}
              <WaveArrow size={20} />
            </Link>
          </section>
        </div>
      </div>

      <p className="px-2 text-center text-sm text-ink-soft">{t('wx.official')}</p>
    </div>
  )
}