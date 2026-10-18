import { Cloud, CloudRain, CloudSun, Droplets, Sun, Waves } from 'lucide-react'
import DryRack from './DryRack'
import { PennantIcon } from '../home/HomeIcons'
import { dryScore, sailLevel, type Day, type Level, type Sky } from '../../lib/weather'
import { localeOf } from '../../lib/time'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

const SKY_ICON = { sun: Sun, partly: CloudSun, cloud: Cloud, rain: CloudRain }
const SKY_BG: Record<Sky, string> = {
  sun: 'linear-gradient(180deg, #1b6f7d, #5aa3b0)',
  partly: 'linear-gradient(180deg, #1f6a7a, #4d97a5)',
  cloud: 'linear-gradient(180deg, #3b5f6b, #5c8190)',
  rain: 'linear-gradient(180deg, #123f52, #35525c)',
}
const LEVEL_COLOR: Record<Level, string> = { good: 'var(--color-risk-low-line)', caution: 'var(--color-risk-moderate-line)', danger: 'var(--color-risk-critical-line)' }
const LEVEL_WORD: Record<Level, Key> = { good: 'lvl.good', caution: 'lvl.caution', danger: 'lvl.danger' }

// The seven days as tiles. Each has a flag for sailing and a rack for drying. Tap one to see it in the sea above.
export default function WeekRack({ week, selected, onSelect }: { week: Day[]; selected: number; onSelect: (i: number) => void }) {
  const t = useT()
  const { lang } = useSettings()
  return (
    <section className="space-y-3">
      <h2 className="font-numeral text-xl font-bold leading-none">{t('wx.week')}</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {week.map((d, i) => {
          const level = sailLevel(d.wind, d.gust, d.wave, d.rain)
          const Icon = SKY_ICON[d.sky]
          const on = i === selected
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(i)}
              className={`w-[104px] shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-card text-left shadow-rest transition active:scale-[0.97] lg:w-auto ${on ? 'border-coral shadow-raised' : 'border-line'}`}
            >
              <span className="flex items-center justify-between px-3 py-2 text-white" style={{ background: SKY_BG[d.sky] }}>
                <span className="font-numeral text-lg font-bold capitalize leading-none">{i === 0 ? t('wx.today') : d.date.toLocaleDateString(localeOf(lang), { weekday: 'short' })}</span>
                <Icon size={24} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="block space-y-1.5 px-3 py-2.5">
                <span className="block font-numeral text-2xl font-extrabold leading-none">{d.tMax}°<span className="text-sm font-semibold text-ink-soft"> {d.tMin}°</span></span>
                <span className="flex items-center gap-1 text-xs font-semibold"><Droplets size={14} strokeWidth={1.8} className="text-teal" aria-hidden />{d.rain}%</span>
                <span className="flex items-center gap-1 text-xs font-semibold"><PennantIcon size={14} className="text-teal" />{d.wind} km/h</span>
                <span className="flex items-center gap-1 text-xs font-semibold"><Waves size={14} strokeWidth={1.8} className="text-teal" aria-hidden />{d.wave} m</span>
                <span className="flex items-center gap-1.5 border-t border-line pt-2 text-xs font-bold">
                  <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 4V28M6 6C12 3 18 9 26 6V16C18 19 12 13 6 16" fill="none" stroke="var(--color-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ fill: LEVEL_COLOR[level] }} /></svg>
                  {t(LEVEL_WORD[level])}
                </span>
                <span className="block"><DryRack score={dryScore(d)} /></span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}