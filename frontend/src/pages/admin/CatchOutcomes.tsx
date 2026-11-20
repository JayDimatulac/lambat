import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { fmtWeight, type Outcomes } from '../../lib/adminApi'

const R = 68
const C = 2 * Math.PI * R

export default function CatchOutcomes({ outcomes }: { outcomes: Outcomes }) {
  const [hot, setHot] = useState<string | null>(null)

  const SEGS = [
    { key: 'Sold', kg: outcomes.SOLD, color: 'var(--color-teal)' },
    { key: 'Redistributed', kg: outcomes.REDISTRIBUTED, color: 'color-mix(in srgb, var(--color-teal) 40%, white)' },
    { key: 'Processed', kg: outcomes.PROCESSED, color: 'var(--color-peach)' },
    { key: 'Lost', kg: outcomes.DISCARDED, color: 'var(--color-coral)' },
    { key: 'Still unsold', kg: outcomes.ACTIVE, color: '#6b8c96' },
  ]
  const TOTAL = SEGS.reduce((s, x) => s + x.kg, 0)
  const pct = (kg: number) => (TOTAL === 0 ? 0 : Math.round((kg / TOTAL) * 100))
  const shown = SEGS.find((s) => s.key === hot)
  const centre = fmtWeight(shown ? shown.kg : TOTAL)

  let acc = 0
  const arcs = SEGS.map((s) => {
    const len = TOTAL === 0 ? 0 : (s.kg / TOTAL) * C
    const arc = { ...s, len, offset: -acc }
    acc += len
    return arc
  })

  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-rest">
      <h2 className="font-display text-xl font-bold">Catch by Outcome</h2>
      <p className="text-sm text-ink-soft">Share of everything landed, by outcome</p>

      <div className="relative mx-auto mt-4 size-48">
        <svg viewBox="0 0 180 180" className="size-full" role="img" aria-label="Catch outcomes">
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-line)" strokeWidth="18" opacity="0.5" />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={hot === a.key ? 23 : 18}
              strokeLinecap="butt"
              strokeDasharray={`${Math.max(a.len - 3, 0)} ${C}`}
              strokeDashoffset={a.offset}
              transform="rotate(-90 90 90)"
              opacity={hot && hot !== a.key ? 0.35 : 1}
              style={{ transition: 'all 0.2s' }}
              onMouseEnter={() => setHot(a.key)}
              onMouseLeave={() => setHot(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-xs font-semibold text-ink-soft">{shown ? shown.key : 'Landed in total'}</span>
          <b className="font-numeral text-3xl leading-none">
            {centre.value}
            <span className="ml-0.5 text-lg">{centre.unit}</span>
          </b>
          {shown && <span className="mt-0.5 text-xs text-ink-soft">{pct(shown.kg)}% of the catch</span>}
        </div>
      </div>

      {TOTAL === 0 && <p className="mt-3 text-center text-sm text-ink-soft">No catches logged yet.</p>}

      <ul className="mt-4 space-y-1">
        {SEGS.map((s) => {
          const w = fmtWeight(s.kg)
          return (
            <li key={s.key}>
              <button
                type="button"
                onMouseEnter={() => setHot(s.key)}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot(s.key)}
                onBlur={() => setHot(null)}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm transition hover:bg-seafoam/60"
              >
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 font-semibold">{s.key}</span>
                <span className="font-numeral font-bold">{w.value} {w.unit}</span>
                <span className="w-10 text-right text-ink-soft">{pct(s.kg)}%</span>
              </button>
            </li>
          )
        })}
      </ul>

      <Link to="/admin/listings" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal hover:underline">
        See the catches
        <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
      </Link>
    </section>
  )
}