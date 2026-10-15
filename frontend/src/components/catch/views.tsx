import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import FishShape from '../FishShape'
import { RISK_ICON } from '../ui/RiskBadge'
import { HORIZON_H, type Catch } from '../../data/mock'
import { RISK } from '../../lib/risk'
import { agoText, rangeText, sellByText } from '../../lib/time'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'

function RiskChip({ c }: { c: Catch }) {
  const r = RISK[c.risk]
  const Icon = RISK_ICON[c.risk]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold ${r.text} ${r.bg} ${r.line}`}>
      <Icon size={14} strokeWidth={1.8} aria-hidden />
      {rangeText(c.hoursMin, c.hoursMax)}h
    </span>
  )
}

/* Time left as a ring, on the same 24h scale as the tide */
function Ring({ c }: { c: Catch }) {
  const mid = (c.hoursMin + c.hoursMax) / 2
  const frac = Math.min(mid, HORIZON_H) / HORIZON_H
  const len = 2 * Math.PI * 18
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" style={{ fill: 'var(--color-card)' }} />
      <circle cx="24" cy="24" r="18" fill="none" strokeWidth="5" style={{ stroke: 'var(--color-line)' }} />
      <circle cx="24" cy="24" r="18" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${len * frac} ${len}`} transform="rotate(-90 24 24)" style={{ stroke: RISK[c.risk].fill }} />
      <text x="24" y="28.5" textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: 'var(--color-navy)' }}>
        {Math.round(mid)}h
      </text>
    </svg>
  )
}

const CUBES = ['left-3 top-3 size-6 rotate-12', 'left-12 bottom-3 size-5 -rotate-6', 'right-16 bottom-4 size-7 rotate-6', 'right-3 top-14 size-4 -rotate-12']

function TrayCard({ c }: { c: Catch }) {
  const t = useT()
  const { lang } = useSettings()
  const closed = !!c.outcome
  return (
    <article className={`relative rounded-md border border-line bg-card p-3 shadow-rest transition hover:shadow-raised ${closed ? 'opacity-75' : ''}`}>
      <div className="relative h-28 overflow-hidden rounded-sm bg-ice">
        {CUBES.map((cls) => <span key={cls} aria-hidden="true" className={`absolute rounded-md bg-card/60 ${cls}`} />)}
        <FishShape shape={c.shape} className="absolute inset-x-6 top-1/2 h-14 -translate-y-1/2 text-teal" />
        {!closed && <div className="absolute right-2 top-2"><Ring c={c} /></div>}
      </div>
      <h3 className="mt-3 font-sans text-lg font-semibold">
        <Link to={`/catches/${c.id}`} className="after:absolute after:inset-0">{c.species}</Link>
      </h3>
      <p className="text-sm text-ink-soft">{c.kg} kg · {c.place}</p>
      <div className="mt-2 space-y-1">
        {c.outcome ? (
          <p className="text-sm font-semibold text-ink-soft">{t(`tally.${c.outcome}`)}</p>
        ) : (
          <>
            <RiskChip c={c} />
            <p className="simple-hide text-sm">{sellByText(c.hoursMin, lang, t)}</p>
          </>
        )}
      </div>
    </article>
  )
}

export function TrayView({ items }: { items: Catch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {items.map((c) => <TrayCard key={c.id} c={c} />)}
    </div>
  )
}

export function ListView({ items }: { items: Catch[] }) {
  const t = useT()
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-card shadow-rest">
      {items.map((c) => {
        const r = RISK[c.risk]
        const Icon = RISK_ICON[c.risk]
        return (
          <li key={c.id}>
            <Link to={`/catches/${c.id}`} className={`flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-seafoam/50 ${c.outcome ? 'opacity-75' : ''}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${r.bg} ${r.text}`}>
                <Icon size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.species} · {c.kg} kg</span>
                <span className="block truncate text-sm text-ink-soft">{c.place} · {agoText(c.hoursAgo, t)}</span>
              </span>
              {c.outcome ? <span className="text-sm font-semibold text-ink-soft">{t(`tally.${c.outcome}`)}</span> : <RiskChip c={c} />}
              <ChevronRight size={20} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}