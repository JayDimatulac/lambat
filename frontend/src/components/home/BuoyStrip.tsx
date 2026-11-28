import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BuoyIcon } from '../icons'
import { RISK } from '../../lib/risk'
import { rangeText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { HORIZON_H, type Catch } from '../../data/mock'
import FishShape from '../FishShape'

// How far a buoy has sunk on its gauge: 0 at the surface (a day or more left) to 1 at the bottom (no time left)
const sunkFor = (c: Catch) => 1 - Math.min(Math.max((c.hoursMin + c.hoursMax) / 2, 0), HORIZON_H) / HORIZON_H

/* Phone-only strip with every catch: active ones first, then finished ones. The next card peeks in from the edge.
   Each card opens that exact catch by its ID, so two "Galunggong 10 kg" entries never get mixed up.
   Left: a tiny tide gauge (the lower the buoy, the less time). Right: the fish name, the time left and the weight. */
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
            <li key={c.id} className="w-[56%] max-w-60 shrink-0 snap-start">
              <Link
                to={`/catches/${c.id}`}
                className={`relative flex h-full min-h-20 items-center gap-2.5 overflow-hidden rounded-2xl border border-line bg-card px-3 py-2.5 shadow-rest transition active:scale-[0.98] ${done ? 'opacity-80' : ''}`}
              >
                {/* a faint fish of its own kind in the corner, and a soft wave along the bottom */}
                <FishShape shape={c.shape} className="pointer-events-none absolute -right-3 -top-1 h-11 w-[5.5rem] -rotate-6 text-teal opacity-[0.08]" />
                <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-4 w-full text-teal" viewBox="0 0 200 16" preserveAspectRatio="none">
                  <path d="M0 8q12.5-7 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0V16H0Z" fill="currentColor" opacity="0.1" />
                </svg>

                {/* a tiny tide gauge: the lower the buoy sits, the less time is left */}
                <span aria-hidden="true" className="relative h-14 w-8 shrink-0 overflow-hidden rounded-full border border-line bg-linear-to-b from-seafoam/40 to-seafoam">
                  <span className="absolute left-1/2 w-8 -translate-x-1/2 transition-all" style={{ top: done ? 22 : `${Math.round(sunkFor(c) * 22)}px`, color: done ? 'var(--color-ink-soft)' : r.fill }}>
                    <BuoyIcon size={32} />
                  </span>
                </span>

                <span className="relative min-w-0">
                  <span className="line-clamp-2 block text-[15px] font-bold leading-tight">{c.species}</span>
                  <span className={`mt-0.5 flex items-baseline gap-1 whitespace-nowrap tabular-nums ${done ? 'text-ink-soft' : r.text}`}>
                    {done ? (
                      <span className="text-sm font-semibold">{t(`tally.${c.outcome!}`)}</span>
                    ) : (
                      <>
                        <span className="text-[15px] font-bold">{rangeText(c.hoursMin, c.hoursMax)}</span>
                        <span className="text-xs font-medium text-ink-soft">{t('unit.hours')}</span>
                      </>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-ink-soft">{c.kg} kg</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}