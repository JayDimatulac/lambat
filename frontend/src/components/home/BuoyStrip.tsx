import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BuoyIcon } from '../icons'
import { RISK } from '../../lib/risk'
import { rangeText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import type { Catch } from '../../data/mock'

/* Phone-only strip with every catch: active ones first, then finished ones. The next card peeks in from the edge.
   Each card opens that exact catch by its ID, so two "Galunggong 10 kg" entries never get mixed up. */
export default function BuoyStrip({ catches }: { catches: Catch[] }) {
  const t = useT()
  if (catches.length === 0) return null
  return (
    <section aria-labelledby="home-catches" className="order-3 space-y-1 lg:hidden">
      <div className="flex items-center justify-between px-1">
        <h2 id="home-catches" className="font-display text-xl font-bold">{t('home.catches')}</h2>
        <Link to="/catches" className="inline-flex min-h-11 items-center gap-0.5 pl-3 text-sm font-semibold text-teal">
          {t('home.seeall')}
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {catches.slice(0, 10).map((c) => {
          const r = RISK[c.risk]
          const done = !!c.outcome
          return (
            <li key={c.id} className="w-[42%] max-w-[200px] shrink-0 snap-start">
              <Link
                to={`/catches/${c.id}`}
                className={`flex h-full min-h-[132px] flex-col rounded-2xl border border-line bg-card p-3 shadow-rest transition active:scale-[0.98] ${done ? 'opacity-80' : ''}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className="grid size-10 place-items-center rounded-full bg-seafoam/60"
                    style={{ color: done ? 'var(--color-ink-soft)' : r.fill }}
                    aria-hidden="true"
                  >
                    <BuoyIcon size={30} />
                  </span>
                  <span className="text-sm font-semibold text-ink-soft">{c.kg} kg</span>
                </span>
                <span className="mt-2 truncate font-display text-lg font-bold leading-tight">{c.species}</span>
                {done ? (
                  <span className="mt-auto inline-flex w-fit items-center whitespace-nowrap rounded-full border border-line bg-seafoam px-3 py-1 text-base font-bold text-navy">
                    {t(`tally.${c.outcome!}`)}
                  </span>
                ) : (
                  <span className={`mt-auto inline-flex w-fit items-center whitespace-nowrap rounded-full border px-3 py-1 text-base font-bold ${r.text} ${r.bg} ${r.line}`}>
                    {rangeText(c.hoursMin, c.hoursMax)}h
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}