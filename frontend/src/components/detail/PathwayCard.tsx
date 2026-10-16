import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Catch } from '../../data/mock'
import { iceFromLanding, type Pathway } from '../../lib/pathways'
import { useT } from '../../lib/i18n'

/* One potential pathway, like a recipe card: what to check first, and when not to do it.
   The checklist is for the person to tick. The card never says the fish is "safe". */
export default function PathwayCard({ p, c }: { p: Pathway; c: Catch }) {
  const t = useT()
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const onIce = iceFromLanding(c)
  const isIceItem = (text: string) => text.startsWith('Kept on ice from landing')
  const done = p.conditions.filter((text, i) => (isIceItem(text) ? onIce : ticked.has(i))).length

  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <article className="space-y-4 rounded-lg border-2 border-teal bg-card p-5 shadow-rest">
      <div>
        <p className="mb-2 inline-block rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">{t('strand.value')}</p>
        <h3 className="font-display text-3xl font-semibold leading-tight">{p.name}</h3>
        <p className="text-ink-soft">{p.detail}</p>
      </div>

      <p className="rounded-md bg-mint p-3 italic">{p.wording}</p>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-lg">{t('va.check')}</h4>
          <span className="text-sm font-semibold text-ink-soft">{t('va.checked', { n: done, total: p.conditions.length })}</span>
        </div>
        <ul className="space-y-2">
          {p.conditions.map((text, i) => {
            const auto = isIceItem(text)
            const on = auto ? onIce : ticked.has(i)
            return (
              <li key={text}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={auto}
                  onClick={() => toggle(i)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition ${on ? 'border-teal bg-seafoam' : 'border-line bg-card'}`}
                >
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-teal bg-teal text-on-accent' : 'border-line'}`}>
                    {on && <Check size={16} strokeWidth={3} aria-hidden />}
                  </span>
                  <span className="flex-1">
                    {text}
                    {auto && <span className="block text-sm text-ink-soft">{t('va.fromlog')}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <h4 className="text-lg">{t('va.avoid')}</h4>
        <ul className="space-y-2">
          {p.avoid.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-risk-critical-bg text-risk-critical" aria-hidden="true">
                <X size={14} strokeWidth={3} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}