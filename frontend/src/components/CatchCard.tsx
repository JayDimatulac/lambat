import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskBadge from './ui/RiskBadge'
import { RISK } from '../lib/risk'
import type { Catch } from '../data/mock'

export default function CatchCard({ c }: { c: Catch }) {
  const r = RISK[c.risk]
  return (
    <Link
      to={`/catches/${c.id}`}
      className="block rounded-md border border-line bg-white p-4 shadow-rest transition hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-base font-semibold">{c.species}</h3>
        <RiskBadge level={c.risk} />
      </div>
      <p className="mt-2 font-display text-[32px] font-bold leading-none">
        {c.kg} <span className="text-base">kg</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
        <MapPin size={14} strokeWidth={1.8} aria-hidden /> {c.place} · {c.ago}
      </p>
      {c.sold ? (
        <p className="mt-3 text-sm italic text-ink-soft">Naibenta na</p>
      ) : (
        <p className={`mt-3 rounded-full px-3 py-1.5 text-sm font-semibold ${r.bg} ${r.text}`}>
          ● {c.remaining} remaining
        </p>
      )}
    </Link>
  )
}
