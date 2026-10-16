import { FishIcon, IceBlockIcon, BuoyIcon } from '../icons'
import type { Catch } from '../../data/mock'
import { hoursAtAmbient, iceLevel } from '../../lib/estimator'
import { clockText, countdownText, agoText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

/* "Bakit ganito?": plain reasons, taken from the same inputs the estimator used */
export function WhyList({ c }: { c: Catch }) {
  const t = useT()
  const m = c.model
  if (!m) return null
  const level = iceLevel(m.events[m.events.length - 1].iceKg, m.kg)
  return (
    <section className="space-y-2 rounded-md border border-line bg-card p-4">
      <h2 className="text-lg">{t('reveal.why')}</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>{c.hoursAgo === 0 ? t('why.time.now') : t('why.time', { when: agoText(c.hoursAgo, t) })}</li>
        <li>{t('why.ice', { level: t(`ice.${level}`).toLowerCase() })}</li>
        <li>{t(hoursAtAmbient(m.l0Min) <= 10 ? 'why.species.fast' : 'why.species.mid', { species: c.species })}</li>
        {m.histamine && <li>{t('why.histamine')}</li>}
      </ul>
    </section>
  )
}

/* Its story: a rope with a knot for the catch, each time ice was added, and now */
export function Story({ c }: { c: Catch }) {
  const t = useT()
  const { lang } = useSettings()
  const m = c.model
  if (!m) return null
  const rows = [
    ...m.events.map((ev, i) => ({
      key: ev.at,
      icon: i === 0 ? FishIcon : IceBlockIcon,
      time: clockText(ev.at, lang, t),
      text: i === 0
        ? t('timeline.caught', { kg: m.kg, ice: t(`ice.${iceLevel(ev.iceKg, m.kg)}`).toLowerCase() })
        : t('timeline.ice', { n: ev.iceKg - m.events[i - 1].iceKg }),
    })),
    { key: 0, icon: BuoyIcon, time: t('when.nowlabel'), text: c.minsMin > 0 ? `${t('detail.timeleft')}: ${countdownText(c.minsMin)}` : t('detail.timesup') },
  ]
  return (
    <section className="rounded-md border border-line bg-card p-4">
      <h2 className="mb-3 text-lg">{t('timeline.title')}</h2>
      <ol className="relative space-y-4 pl-10">
        <span className="absolute bottom-3 left-[15px] top-3 w-0.5 rounded bg-line" aria-hidden="true" />
        {rows.map((r) => (
          <li key={r.key} className="relative">
            <span className="absolute -left-10 top-0 grid size-8 place-items-center rounded-full bg-teal text-on-accent" aria-hidden="true">
              <r.icon size={18} />
            </span>
            <p className="font-semibold leading-tight">{r.text}</p>
            <p className="text-sm text-ink-soft">{r.time}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}