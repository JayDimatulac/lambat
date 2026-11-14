import { Clock, Cloud, CloudRain, CloudSun, Sun } from 'lucide-react'
import { calmWindow, hour12, sailLevel, type Hour, type Level, type Sky } from '../../lib/weather'
import { useT } from '../../lib/i18n'

// The hours shown as columns above the bar. Change this list to show other hours (the forecast covers 5 AM to 7 PM).
const SLOTS = [6, 9, 12, 15, 17, 18]

const SKY_ICON = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
const SKY_TONE: Record<Sky, string> = { sun: 'text-[#f5b83d]', partly: 'text-[#f5b83d]', cloud: 'text-[#7ea6b3]', rain: 'text-[#4f8fb0]' }

// Today as one calm bar: soft green where it is good to go out, amber where to be careful,
// and red where to stay ashore. A small marker shows where you are now.
const TONE: Record<Level, string> = {
  good: 'bg-risk-low-line/60',
  caution: 'bg-risk-moderate-line/70',
  danger: 'bg-risk-critical-line/70',
}

export default function DayRibbon({ hours, nowHour }: { hours: Hour[]; nowHour: number }) {
  const t = useT()
  const n = hours.length
  const pct = (i: number) => `${((i + 0.5) / n) * 100}%`
  const nowIdx = hours.findIndex((x) => x.h === nowHour)
  // hours that have already passed are no use for planning
  const ahead = hours.filter((x) => x.h >= nowHour)
  const calm = ahead.length ? calmWindow(ahead) : null
  const slots = SLOTS.map((h) => hours.find((x) => x.h === h)).filter((x): x is Hour => !!x)

  return (
    <section className="min-w-0 space-y-5 rounded-lg border border-line bg-card p-5 shadow-rest lg:h-full">
      <h2 className="flex items-center gap-2 text-xl">
        <Clock size={22} strokeWidth={1.8} aria-hidden="true" className="text-teal" />
        {t('wx.hourly')}
      </h2>

      {slots.length > 0 && (
        <ul className="grid divide-x divide-line rounded-2xl border border-line bg-ice/60 py-3" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
          {slots.map((x) => {
            const Icon = SKY_ICON[x.sky]
            return (
              <li key={x.h} className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-xs font-semibold text-ink-soft">{hour12(x.h)}</span>
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" className={SKY_TONE[x.sky]} />
                <span className="font-numeral text-sm font-bold">{x.temp !== undefined ? `${x.temp}°C` : '–'}</span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="relative">
        <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label={t('wx.hourly')}>
          {hours.map((x) => (
            <span key={x.h} className={`flex-1 ${TONE[sailLevel(x.wind, x.gust ?? x.wind * 1.5, x.wave, x.rain)]} ${x.h < nowHour ? 'opacity-40' : ''}`} />
          ))}
        </div>
        {nowIdx >= 0 && (
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-navy shadow-rest"
            style={{ left: pct(nowIdx) }}
            aria-hidden="true"
          />
        )}
      </div>

      <p className="flex items-center gap-2.5 text-[15px] font-semibold">
        <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-risk-low-line/70" />
        {calm ? `${t('wx.best')}: ${hour12(calm.from)} – ${hour12(calm.to)}` : t('wx.nowindow')}
      </p>
    </section>
  )
}