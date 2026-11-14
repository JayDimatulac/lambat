import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Cloud, CloudRain, CloudSun, Droplet, Info, Sun, TriangleAlert, Waves, Wind, type LucideIcon } from 'lucide-react'
import WeatherHero from '../components/weather/WeatherHero'
import DayRibbon from '../components/weather/DayRibbon'
import WeekStrip from '../components/weather/WeekStrip'
import DryRack from '../components/weather/DryRack'
import { WaveArrow } from '../components/home/HomeIcons'
import { calmWindow, compass, dryScore, hour12, sailLevel, useForecast, windWindow, type Level, type Sky } from '../lib/weather'
import { localeOf } from '../lib/time'
import { useT, type Key } from '../lib/i18n'
import { useSettings } from '../lib/settings'
import { useUser } from '../lib/auth'

const SKY_ICON: Record<Sky, LucideIcon> = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
const SKY_WORD: Record<Sky, Key> = { sun: 'sky.sun', partly: 'sky.partly', cloud: 'sky.cloud', rain: 'sky.rain' }

// Whole class strings on purpose, so Tailwind can see them
const LEVEL: Record<Level, { why: Key; adv: Key; box: string; title: string }> = {
  good: { why: 'wx.why.good', adv: 'wx.adv.good', box: 'border-risk-low-line/60 bg-risk-low-bg', title: 'text-risk-low' },
  caution: { why: 'wx.why.caution', adv: 'wx.adv.caution', box: 'border-risk-high-line/40 bg-linear-to-r from-risk-high-bg to-risk-moderate-bg', title: 'text-coral-dark' },
  danger: { why: 'wx.why.danger', adv: 'wx.adv.danger', box: 'border-risk-critical-line/60 bg-risk-critical-bg', title: 'text-risk-critical' },
}

// Sea state from the wave height (metres)
type Sea = 'calm' | 'moderate' | 'rough'
const seaOf = (wave: number): Sea => (wave < 0.6 ? 'calm' : wave < 1.5 ? 'moderate' : 'rough')
const SEA: Record<Sea, { word: Key; why: Key; badge: string }> = {
  calm: { word: 'wx.sea.calm', why: 'wx.sea.why.calm', badge: 'bg-risk-low-bg text-risk-low' },
  moderate: { word: 'wx.sea.moderate', why: 'wx.sea.why.moderate', badge: 'bg-risk-moderate-bg text-risk-moderate' },
  rough: { word: 'wx.sea.rough', why: 'wx.sea.why.rough', badge: 'bg-risk-critical-bg text-risk-critical' },
}

export default function Weather() {
  const t = useT()
  const { lang } = useSettings()
  const user = useUser()
  const { week, hours, live, place, status, now: conditions } = useForecast(user.fisher?.landing)
  const [now] = useState(() => new Date())
  const [sel, setSel] = useState(0)

  // no verdict until the real forecast is here: the sample must never say "safe to sail"
  if (status === 'loading') {
    return <p className="px-2 py-16 text-center text-ink-soft">{t('wx.loading')}</p>
  }

  const day = week[sel]
  const level: Level = live ? sailLevel(day.wind, day.gust, day.wave, day.rain) : 'caution' // sample data never says it is safe
  const L = LEVEL[level]
  const hour = sel === 0 ? Math.min(23, Math.max(0, now.getHours())) : 12
  const upcoming = hours.filter((x) => x.h >= hour) // hours that have already passed are no use for planning
  const strong = sel === 0 && upcoming.length ? windWindow(upcoming) : null
  const calm = sel === 0 && upcoming.length ? calmWindow(upcoming) : null
  const score = dryScore(day)
  const best = week.reduce((b, d, i) => (dryScore(d) > dryScore(week[b]) ? i : b), 0)
  const dayName = (i: number) => week[i].date.toLocaleDateString(localeOf(lang), { weekday: 'long' })

  // right-now numbers for today, the day's own numbers for any other day
  const cur = sel === 0 ? conditions : undefined
  const temp = cur?.temp ?? day.tMax
  const wind = cur?.wind ?? day.wind
  const wave = cur?.wave ?? day.wave
  const humidity = cur?.humidity
  const dir = cur?.windDir !== undefined ? ` ${compass(cur.windDir)}` : ''
  const sea = SEA[seaOf(wave)]

  const tags: string[] = []
  if (sel !== 0) tags.push(dayName(sel))
  if (!live) tags.push(t('ui.sample'))

  const message = `${t(L.why)}${strong ? ` ${t('wx.window', { from: hour12(strong.from), to: hour12(strong.to) })}` : ''}`

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{t('nav.weather')}</h1>

      {/* ONE CALM ANSWER: is it good to go out? */}
      <WeatherHero
        place={place ?? user.fisher?.landing ?? user.barangay}
        tags={tags}
        temp={String(temp)}
        SkyIcon={SKY_ICON[day.sky]}
        skyLabel={t(SKY_WORD[day.sky])}
        message={message}
        bestTime={calm ? `${t('wx.best')}: ${hour12(calm.from)} – ${hour12(calm.to)}` : null}
        stats={[
          { Icon: Wind, label: t('home.wx.wind'), value: `${wind} km/h${dir}` },
          { Icon: Waves, label: t('home.wx.waves'), value: `${wave} m` },
          { Icon: Droplet, label: t('home.wx.humidity'), value: humidity !== undefined ? `${humidity}%` : '–' },
        ]}
      />

      {/* THE WEEK: tap a day to see it above */}
      <WeekStrip week={week} selected={sel} onSelect={setSel} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch">
        {/* TODAY, HOUR BY HOUR */}
        {sel === 0 ? (
          <DayRibbon hours={hours} nowHour={hour} />
        ) : (
          <section className="min-w-0 space-y-3 rounded-lg border border-dashed border-line bg-card p-5 lg:h-full">
            <h2 className="text-xl">{dayName(sel)}</h2>
            <p className="text-ink-soft">{t('wx.hourly.today')}</p>
            <button type="button" onClick={() => setSel(0)} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">
              {t('wx.back')}
              <WaveArrow size={20} />
            </button>
          </section>
        )}

        <div className="min-w-0 space-y-4">
          {/* SEA CONDITIONS */}
          <section className="relative overflow-hidden rounded-lg border border-line bg-card p-5 shadow-rest">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl">
                <Waves size={22} strokeWidth={1.8} aria-hidden="true" className="text-teal" />
                {t('wx.sea')}
              </h2>
              <span title={t('wx.sea.info')} className="text-ink-soft">
                <Info size={18} strokeWidth={1.8} aria-label={t('wx.sea.info')} />
              </span>
            </div>
            <div className="relative z-10 mt-3 max-w-[62%] space-y-2 sm:max-w-[68%]">
              <p className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-semibold ${sea.badge}`}>
                <Waves size={16} strokeWidth={1.8} aria-hidden="true" />
                {t(sea.word)}
              </p>
              <p className="text-sm leading-snug text-ink-soft">{t(sea.why)}</p>
            </div>
            <svg aria-hidden="true" viewBox="0 0 160 70" className="pointer-events-none absolute -bottom-1 -right-1 h-12 w-28 sm:h-16 sm:w-36">
              <path d="M0 40 C20 20, 40 20, 60 38 S100 56, 120 34 S150 14, 160 22 V70 H0Z" fill="#8fd3e3" opacity=".55" />
              <path d="M0 52 C25 36, 45 36, 70 50 S115 66, 140 46 S155 38, 160 42 V70 H0Z" fill="#3a9bab" opacity=".6" />
            </svg>
          </section>

          {/* DRYING */}
          <section className="flex items-center justify-between gap-4 rounded-lg border border-line bg-card p-5 shadow-rest">
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl">{t('wx.dry')}</h2>
              <p className="text-sm font-semibold text-teal">{t('wx.dry.score', { n: score })}</p>
              <p className="text-sm leading-snug text-ink-soft">{t('wx.dry.best', { day: dayName(best) })}</p>
              <Link to="/value-added" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal hover:underline">
                {t('wx.dry.cta')}
                <WaveArrow size={20} />
              </Link>
            </div>
            <div className="shrink-0 [&_svg]:h-auto [&_svg]:w-20 sm:[&_svg]:w-[120px]">
              <DryRack score={score} size="md" />
            </div>
          </section>
        </div>
      </div>

      {/* WEATHER ADVISORY (real forecast only) */}
      {live && (
        <section className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:gap-5 ${L.box}`}>
          <div className={`flex shrink-0 items-center gap-3 ${L.title}`}>
            {level === 'good' ? <CircleCheck size={32} strokeWidth={1.8} aria-hidden="true" /> : <TriangleAlert size={32} strokeWidth={1.8} aria-hidden="true" />}
            <h2 className="font-numeral text-lg font-bold">{t('wx.adv.title')}</h2>
          </div>
          <span aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-deep/15 sm:block" />
          <p className="text-sm leading-snug text-navy">{t(L.adv)}</p>
        </section>
      )}

      <p className="px-2 text-center text-sm text-ink-soft">{t('wx.official')}</p>
    </div>
  )
}