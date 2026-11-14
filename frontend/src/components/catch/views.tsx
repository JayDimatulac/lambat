import { Link } from 'react-router-dom'
import { Check, ChevronRight, Clock, Share2, Trash2 } from 'lucide-react'
import FishShape from '../FishShape'
import { RISK_ICON } from '../ui/RiskBadge'
import { HORIZON_H, type Catch, type Outcome } from '../../data/mock'
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

const OUTCOME_ICON: Record<Outcome, typeof Check> = { sold: Check, shared: Share2, lost: Trash2 }

/* A closed catch: icon + word, so it never relies on color alone */
function OutcomePill({ outcome }: { outcome: Outcome }) {
  const t = useT()
  const Icon = OUTCOME_ICON[outcome]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-seafoam px-3 py-1 text-sm font-semibold text-navy">
      <Icon size={15} strokeWidth={2} aria-hidden />
      {t(`tally.${outcome}`)}
    </span>
  )
}

function TrayCard({ c }: { c: Catch }) {
  const { lang } = useSettings()
  const t = useT()
  const closed = !!c.outcome
  return (
    <article className={`relative flex flex-col rounded-lg border border-line bg-card p-4 shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised ${closed ? 'opacity-80' : ''}`}>
      <div className="relative h-24 overflow-hidden rounded-md bg-gradient-to-br from-seafoam to-ice">
        <svg aria-hidden="true" viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-8 w-full text-teal/15">
          <path fill="currentColor" d="M0 18C30 6 60 6 90 18S150 30 200 14V40H0Z" />
        </svg>
        <FishShape shape={c.shape} className="absolute inset-x-8 top-1/2 h-14 -translate-y-1/2 text-teal" />
        {!closed && <div className="absolute right-1.5 top-1.5"><Ring c={c} /></div>}
      </div>
      <h3 className="mt-3 font-sans text-lg font-bold leading-tight">
        <Link to={`/catches/${c.id}`} className="after:absolute after:inset-0">{c.species}</Link>
      </h3>
      <p className="text-sm text-ink-soft">{c.kg} kg · {c.place}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {c.outcome ? (
          <OutcomePill outcome={c.outcome} />
        ) : (
          <>
            <RiskChip c={c} />
            <p className="simple-hide flex items-center gap-1 text-sm">
              <Clock size={14} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
              {sellByText(c.hoursMin, lang, t)}
            </p>
          </>
        )}
      </div>
    </article>
  )
}

export function TrayView({ items }: { items: Catch[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">
      {items.map((c) => <TrayCard key={c.id} c={c} />)}
    </div>
  )
}

export function ListView({ items }: { items: Catch[] }) {
  const t = useT()
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      {items.map((c) => {
        const r = RISK[c.risk]
        const Icon = c.outcome ? OUTCOME_ICON[c.outcome] : RISK_ICON[c.risk]
        return (
          <li key={c.id}>
            <Link to={`/catches/${c.id}`} className={`flex min-h-[68px] items-center gap-3 px-4 py-3 transition hover:bg-seafoam/50 sm:gap-4 sm:px-5 ${c.outcome ? 'opacity-80' : ''}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${c.outcome ? 'bg-seafoam text-navy' : `${r.bg} ${r.text}`}`}>
                <Icon size={20} strokeWidth={1.8} aria-hidden />
              </span>
              <FishShape shape={c.shape} className="hidden h-8 w-16 shrink-0 text-teal sm:block" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.species} · {c.kg} kg</span>
                <span className="block truncate text-sm text-ink-soft">{c.place} · {agoText(c.hoursAgo, t)}</span>
              </span>
              {c.outcome ? <OutcomePill outcome={c.outcome} /> : <RiskChip c={c} />}
              <ChevronRight size={20} strokeWidth={1.8} className="shrink-0 text-ink-soft" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}