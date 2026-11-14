import { CalendarDays, Cloud, CloudRain, CloudSun, Sun } from 'lucide-react'
import { sailLevel, type Day, type Level, type Sky } from '../../lib/weather'
import { localeOf } from '../../lib/time'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

const SKY_ICON = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
const SKY_TONE: Record<Sky, string> = { sun: 'text-[#f5b83d]', partly: 'text-[#f5b83d]', cloud: 'text-[#7ea6b3]', rain: 'text-[#4f8fb0]' }
const DOT: Record<Level, string> = { good: 'bg-risk-low-line', caution: 'bg-risk-moderate-line', danger: 'bg-risk-critical-line' }
const WORD: Record<Level, Key> = { good: 'lvl.good', caution: 'lvl.caution', danger: 'lvl.danger' }

// The week as seven quiet tiles: the day, one sky, the high, and a small dot for how it is for sailing.
// Tap a day to see it in the picture above.
export default function WeekStrip({ week, selected, onSelect }: { week: Day[]; selected: number; onSelect: (i: number) => void }) {
  const t = useT()
  const { lang } = useSettings()
  const loc = localeOf(lang)
  // "Nov 14 – 20, 2026" (and "Nov 28 – Dec 4, 2026" across two months), in the app's language
  const range = new Intl.DateTimeFormat(loc, { month: 'short', day: 'numeric', year: 'numeric' }).formatRange(week[0].date, week[week.length - 1].date)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl">{t('wx.week')}</h2>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium shadow-rest">
          <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" className="text-teal" />
          {range}
        </p>
      </div>

      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [contain:inline-size] lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0 lg:[contain:none]">
        {week.map((d, i) => {
          const Icon = SKY_ICON[d.sky]
          const level = sailLevel(d.wind, d.gust, d.wave, d.rain)
          const on = i === selected
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(i)}
              className={`flex w-[84px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 transition active:scale-[0.97] lg:w-auto ${on ? 'border-teal bg-seafoam shadow-rest' : 'border-line bg-card hover:bg-seafoam/50'}`}
            >
              <span className="text-sm font-semibold capitalize">{i === 0 ? t('wx.today') : d.date.toLocaleDateString(loc, { weekday: 'short' })}</span>
              <Icon size={28} strokeWidth={1.6} className={SKY_TONE[d.sky]} aria-hidden />
              <span className="font-numeral text-lg font-bold leading-none">{d.tMax}°C</span>
              <span className={`size-2.5 rounded-full ${DOT[level]}`} aria-hidden="true" />
              <span className="sr-only">{t(WORD[level])}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}