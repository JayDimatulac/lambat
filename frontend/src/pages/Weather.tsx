import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Waves } from 'lucide-react'
import SeaScene from '../components/weather/SeaScene'
import HorizonStrip from '../components/weather/HorizonStrip'
import WeekRack from '../components/weather/WeekRack'
import DryRack from '../components/weather/DryRack'
import { PennantIcon, WaveArrow } from '../components/home/HomeIcons'
import { WEATHER_IS_LIVE, dryScore, hour12, sailLevel, todayHours, weekFrom, windWindow, type Level, type Sky } from '../lib/weather'
import { localeOf } from '../lib/time'
import { useT, type Key } from '../lib/i18n'
import { useSettings } from '../lib/settings'

const SKY_WORD: Record<Sky, Key> = { sun: 'sky.sun', partly: 'sky.partly', cloud: 'sky.cloud', rain: 'sky.rain' }
const LEVEL: Record<Level, { word: Key; why: Key; color: string; bg: string }> = {
  good: { word: 'level.good', why: 'wx.why.good', color: 'var(--color-risk-low-line)', bg: 'bg-risk-low-bg' },
  caution: { word: 'level.caution', why: 'wx.why.caution', color: 'var(--color-risk-moderate-line)', bg: 'bg-risk-moderate-bg' },
  danger: { word: 'level.danger', why: 'wx.why.danger', color: 'var(--color-risk-critical-line)', bg: 'bg-risk-critical-bg' },
}

export default function Weather() {
  const t = useT()
  const { lang } = useSettings()
  const now = new Date()
  const week = useMemo(() => weekFrom(new Date()), [])
  const hours = useMemo(() => todayHours(), [])
  const [sel, setSel] = useState(0)

  const day = week[sel]
  const level = sailLevel(day.wind, day.gust, day.wave, day.rain)
  const L = LEVEL[level]
  const hour = sel === 0 ? Math.min(23, Math.max(0, now.getHours())) : 12
  const strong = sel === 0 ? windWindow(hours) : null
  const score = dryScore(day)
  const best = week.reduce((b, d, i) => (dryScore(d) > dryScore(week[b]) ? i : b), 0)
  const dayName = (i: number) => week[i].date.toLocaleDateString(localeOf(lang), { weekday: 'long' })

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
      {/* THE SEA RIGHT NOW (or at noon on the day you tapped) */}
      <section className="overflow-hidden rounded-lg shadow-raised lg:col-start-1 lg:row-start-1">
        <div className="relative">
          <SeaScene day={day} hour={hour} level={level} />
          <div className="absolute left-4 top-3 text-white">
            <div className="flex items-center gap-2">
              <h1 className="font-numeral text-sm font-bold text-white">{t('nav.weather')}</h1>
              {!WEATHER_IS_LIVE && <span className="rounded-full bg-deep/50 px-2 py-0.5 text-xs font-semibold text-white">{t('ui.sample')}</span>}
            </div>
            <p className="font-numeral text-[56px] font-extrabold leading-none">{day.tMax}°</p>
            <p className="text-sm font-semibold text-white">{t(SKY_WORD[day.sky])}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-deep/45 px-2.5 py-1 text-xs font-bold"><PennantIcon size={14} />{day.wind} km/h</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-deep/45 px-2.5 py-1 text-xs font-bold"><Waves size={14} strokeWidth={1.8} aria-hidden />{day.wave} m</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-deep/45 px-2.5 py-1 text-xs font-bold"><Droplets size={14} strokeWidth={1.8} aria-hidden />{day.rain}%</span>
            </div>
          </div>
        </div>
        <div className={`flex items-start gap-3 border-l-8 bg-card p-4 ${L.bg}`} style={{ borderLeftColor: L.color }} role="status">
          <svg width="30" height="30" viewBox="0 0 32 32" className="mt-0.5 shrink-0" aria-hidden="true"><path d="M6 4V28M6 6C12 3 18 9 26 6V16C18 19 12 13 6 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ fill: L.color, stroke: 'var(--color-deep)' }} /></svg>
          <div>
            <p className="font-numeral text-2xl font-bold leading-tight">{t(L.word)}</p>
            <p className="text-sm leading-snug">
              {t(L.why)}
              {strong && ` ${t('wx.window', { from: hour12(strong.from), to: hour12(strong.to) })}`}
            </p>
          </div>
        </div>
      </section>

      {/* TODAY, HOUR BY HOUR */}
      <div className="lg:col-start-2 lg:row-start-1">
        {sel === 0 ? (
          <HorizonStrip hours={hours} nowHour={hour} />
        ) : (
          <section className="space-y-2 rounded-lg border border-dashed border-line bg-card p-5">
            <h2 className="font-numeral text-xl font-bold">{dayName(sel)}</h2>
            <p className="text-ink-soft">{t('wx.hourly.today')}</p>
            <button type="button" onClick={() => setSel(0)} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">
              {t('wx.back')}
              <WaveArrow size={20} />
            </button>
          </section>
        )}
      </div>

      {/* THE WEEK */}
      <div className="lg:col-span-2 lg:row-start-2">
        <WeekRack week={week} selected={sel} onSelect={setSel} />
      </div>

      {/* DRYING */}
      <section className="space-y-3 rounded-lg border border-line bg-card p-5 shadow-rest lg:col-start-1 lg:row-start-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-numeral text-xl font-bold leading-none">{t('wx.dry')}</h2>
            <p className="mt-1.5 text-sm font-semibold text-teal">{t('wx.dry.score', { n: score })}</p>
          </div>
          <DryRack score={score} size="lg" />
        </div>
        <p className="text-sm leading-snug">{t('wx.dry.why')}</p>
        <p className="rounded-md bg-seafoam px-3 py-2 text-sm font-semibold">{t('wx.dry.best', { day: dayName(best) })}</p>
        <Link to="/value-added" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-5 text-sm font-semibold text-deep">
          {t('wx.dry.cta')}
          <WaveArrow size={20} />
        </Link>
      </section>

      {/* THE HONEST NOTE */}
      <p className="flex items-start gap-3 rounded-lg border border-dashed border-teal/50 bg-seafoam/50 p-4 text-sm leading-snug lg:col-start-2 lg:row-start-3">
        <PennantIcon size={24} className="mt-0.5 shrink-0 text-teal" />
        {t('wx.official')}
      </p>
    </div>
  )
}