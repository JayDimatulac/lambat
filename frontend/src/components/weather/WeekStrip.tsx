import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react'
import { sailLevel, type Day, type Level } from '../../lib/weather'
import { localeOf } from '../../lib/time'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

const SKY_ICON = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
const DOT: Record<Level, string> = { good: 'bg-risk-low-line', caution: 'bg-risk-moderate-line', danger: 'bg-risk-critical-line' }
const WORD: Record<Level, Key> = { good: 'lvl.good', caution: 'lvl.caution', danger: 'lvl.danger' }

// The week as seven quiet tiles: the day, one sky, the high, and a small dot for how it is for sailing.
// The numbers live under "More details". Tap a day to see it in the picture above.
export default function WeekStrip({ week, selected, onSelect }: { week: Day[]; selected: number; onSelect: (i: number) => void }) {
  const t = useT()
  const { lang } = useSettings()
  return (
    <section className="space-y-3">
      <h2 className="text-xl">{t('wx.week')}</h2>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
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
              className={`flex w-[76px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 transition active:scale-[0.97] lg:w-auto ${on ? 'border-teal bg-seafoam' : 'border-line bg-card hover:bg-seafoam/50'}`}
            >
              <span className="text-sm font-semibold capitalize">{i === 0 ? t('wx.today') : d.date.toLocaleDateString(localeOf(lang), { weekday: 'short' })}</span>
              <Icon size={26} strokeWidth={1.6} className="text-teal" aria-hidden />
              <span className="font-numeral text-xl font-bold leading-none">{d.tMax}°</span>
              <span className={`size-2.5 rounded-full ${DOT[level]}`} aria-hidden="true" />
              <span className="sr-only">{t(WORD[level])}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}