import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BuoyIcon } from '../icons'
import { RISK } from '../../lib/risk'
import { rangeText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import type { Catch } from '../../data/mock'

/* Phone-only strip with every catch: active ones first, then finished ones. The next card peeks in from the edge.
   Each card opens that exact catch by its ID, so two "Galunggong 10 kg" entries never get mixed up.
   Left: the buoy with its weight under it. Right: the fish name (it may wrap to two lines) and the time left. */
export default function BuoyStrip({ catches }: { catches: Catch[] }) {
  const t = useT()
  if (catches.length === 0) return null
  return (
    <section aria-labelledby="home-catches" className="order-3 space-y-1 lg:hidden">
      <div className="flex items-center justify-between px-1">
        <h2 id="home-catches" className="font-display text-lg font-bold">{t('home.catches')}</h2>
        <Link to="/catches" className="inline-flex min-h-11 items-center gap-0.5 pl-3 text-sm font-semibold text-teal">
          {t('home.seeall')}
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-2 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {catches.slice(0, 10).map((c) => {
          const r = RISK[c.risk]
          const done = !!c.outcome
          return (
            <li key={c.id} className="w-[54%] max-w-60 shrink-0 snap-start">
              <Link
                to={`/catches/${c.id}`}
                className={`flex h-full min-h-21 items-center gap-2.5 rounded-2xl border border-line bg-card px-3 py-3 shadow-rest transition active:scale-[0.98] ${done ? 'opacity-80' : ''}`}
              >
                <span className="flex shrink-0 flex-col items-center gap-0.5">
                  <span style={{ color: done ? 'var(--color-ink-soft)' : r.fill }} aria-hidden="true">
                    <BuoyIcon size={30} />
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{c.kg} kg</span>
                </span>
                <span aria-hidden="true" className="h-10 w-px shrink-0 bg-line" />
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-[15px] font-semibold leading-tight">{c.species}</span>
                  <span className={`mt-0.5 block whitespace-nowrap text-sm font-medium ${done ? 'text-ink-soft' : r.text}`}>
                    {done ? t(`tally.${c.outcome!}`) : `${rangeText(c.hoursMin, c.hoursMax)} ${t('unit.hours')}`}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}