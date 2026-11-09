import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Sample figures, the same totals the old fish showed (tonnes)
const SEGS = [
  { key: 'Sold', t: 11.2, color: 'var(--color-teal)' },
  { key: 'Redistributed', t: 2.4, color: 'color-mix(in srgb, var(--color-teal) 40%, white)' },
  { key: 'Processed', t: 3.1, color: 'var(--color-peach)' },
  { key: 'Lost', t: 1.9, color: 'var(--color-coral)' },
]
const TOTAL = SEGS.reduce((s, x) => s + x.t, 0)
const R = 68
const C = 2 * Math.PI * R

export default function CatchOutcomes() {
  const [hot, setHot] = useState<string | null>(null)
  const shown = SEGS.find((s) => s.key === hot)

  let acc = 0
  const arcs = SEGS.map((s) => {
    const len = (s.t / TOTAL) * C
    const arc = { ...s, len, offset: -acc }
    acc += len
    return arc
  })

  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-rest">
      <h2 className="font-display text-xl font-bold">Where the catch went</h2>
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
            {shown ? shown.t : TOTAL.toFixed(1)}
            <span className="ml-0.5 text-lg">t</span>
          </b>
          {shown && <span className="mt-0.5 text-xs text-ink-soft">{Math.round((shown.t / TOTAL) * 100)}% of the catch</span>}
        </div>
      </div>

      <ul className="mt-4 space-y-1">
        {SEGS.map((s) => (
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
              <span className="font-numeral font-bold">{s.t} t</span>
              <span className="w-10 text-right text-ink-soft">{Math.round((s.t / TOTAL) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>

      <Link to="/admin/listings" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal hover:underline">
        See the catches
        <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
      </Link>
    </section>
  )
}