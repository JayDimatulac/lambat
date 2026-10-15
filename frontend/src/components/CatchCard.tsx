import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import RiskBadge from './ui/RiskBadge'
import { RISK } from '../lib/risk'
import { formatRemaining, sellBy } from '../lib/time'
import type { Catch } from '../data/mock'

export default function CatchCard({ c }: { c: Catch }) {
  const r = RISK[c.risk]
  const urgent = !c.sold && (c.risk === 'high' || c.risk === 'critical')
  return (
    <article
      className={`relative rounded-md border bg-white p-4 shadow-rest transition hover:shadow-raised ${
        urgent ? `border-2 ${r.line}` : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-lg font-semibold">
          {/* Stretched link: the ::after covers the whole card, so the card is clickable */}
          <Link to={`/catches/${c.id}`} className="after:absolute after:inset-0">
            {c.species}
          </Link>
        </h3>
        <RiskBadge level={c.risk} />
      </div>
      <p className="mt-2 font-display text-[32px] font-bold leading-none">
        {c.kg} <span className="text-base">kg</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-base text-ink-soft">
        <MapPin size={16} strokeWidth={1.8} aria-hidden /> {c.place} · {c.ago}
      </p>

      {c.sold ? (
        <p className="mt-3 text-base italic text-ink-soft">Naibenta na</p>
      ) : (
        <>
          <p className={`mt-3 rounded-full px-3 py-1.5 text-base font-semibold ${r.bg} ${r.text}`}>
            ● {formatRemaining(c.hoursMin, c.hoursMax)}
          </p>
          <p className="mt-2 text-base font-medium">Ibenta bago mag-{sellBy(c.hoursMin)}</p>
          {urgent && (
            <Link
              to={`/buyers?catch=${c.id}`}
              className="relative z-10 mt-3 flex items-center justify-center gap-2 rounded-sm bg-coral px-4 py-3 text-base font-semibold text-navy hover:brightness-95"
            >
              Humanap ng Mamimili <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
            </Link>
          )}
        </>
      )}
    </article>
  )
}