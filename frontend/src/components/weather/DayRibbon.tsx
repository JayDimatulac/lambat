import { calmWindow, hour12, sailLevel, windWindow, type Hour, type Level } from '../../lib/weather'
import { useT } from '../../lib/i18n'

// Today as one calm ribbon instead of a column of icons per hour: soft green where it is good to go out,
// amber where to be careful, and red where to stay ashore. A small marker shows where you are now.
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
  const calm = calmWindow(hours)
  const strong = windWindow(hours)

  return (
    <section className="min-w-0 space-y-4 rounded-lg border border-line bg-card p-5 shadow-rest">
      <h2 className="text-xl">{t('wx.hourly')}</h2>

      <div className="relative pt-6">
        <div className="flex h-4 gap-px overflow-hidden rounded-full" role="img" aria-label={t('wx.hourly')}>
          {hours.map((x) => (
            <span key={x.h} className={`flex-1 ${TONE[sailLevel(x.wind, x.wind * 1.5, x.wave, x.rain)]}`} />
          ))}
        </div>
        {nowIdx >= 0 && (
          <>
            <span className="absolute top-0 -translate-x-1/2 text-xs font-bold text-teal" style={{ left: pct(nowIdx) }}>{t('when.nowlabel')}</span>
            <span className="absolute top-8 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-navy shadow-rest" style={{ left: pct(nowIdx) }} aria-hidden="true" />
          </>
        )}
      </div>

      <div className="relative h-4 text-xs font-semibold text-ink-soft" aria-hidden="true">
        {hours.map((x, i) => (x.h - hours[0].h) % 3 === 0 ? (
          <span key={x.h} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(i) }}>{hour12(x.h)}</span>
        ) : null)}
      </div>

      <ul className="space-y-1.5 text-[15px] font-semibold">
        <li className="flex items-center gap-2.5">
          <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-risk-low-line/70" />
          {calm ? `${t('wx.best')}: ${hour12(calm.from)} – ${hour12(calm.to)}` : t('wx.nowindow')}
        </li>
        {strong && (
          <li className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-risk-critical-line/70" />
            {t('wx.avoid')}: {hour12(strong.from)} – {hour12(strong.to)}
          </li>
        )}
      </ul>
    </section>
  )
}