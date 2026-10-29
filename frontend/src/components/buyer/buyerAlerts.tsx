import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HornIcon } from '../../components/buyer/BuyerIcons'
import { useBuyerAlerts } from '../../lib/buyerAlerts'
import { useMarket } from '../../lib/market'
import { useBT, type BKey } from '../../lib/buyerText'

const ORDER_TEXT: Record<string, BKey> = {
  offered: 'order.waiting', declined: 'order.declined', confirmed: 'alert.o.confirmed', onway: 'alert.o.onway', received: 'alert.o.received',
}

/* The alerts as a rope: every knot is one news item. A coral knot that glows is new. */
export default function BuyerAlerts() {
  const b = useBT()
  const { now } = useMarket()
  const { alerts, seenAt, markSeen } = useBuyerAlerts()
  const [since] = useState(seenAt) // what counted as new when you opened this page
  useEffect(() => {
    const id = window.setTimeout(markSeen, 1500)
    return () => window.clearTimeout(id)
  }, [markSeen])

  const ago = (at: number) => {
    const min = Math.max(0, Math.floor((now - at) / 60000))
    return min < 1 ? b('ago.now') : min < 60 ? b('ago.min', { n: min }) : b('ago.hr', { n: Math.floor(min / 60) })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[28px]"><HornIcon size={30} className="text-teal" />{b('alerts.title')}</h1>
        <p className="text-ink-soft">{b('alerts.sub')}</p>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{b('alerts.empty')}</p>
      ) : (
        <ol className="relative space-y-4 pl-10">
          <span className="absolute bottom-3 left-[15px] top-3 w-0.5" style={{ background: 'repeating-linear-gradient(180deg, var(--color-line) 0 8px, transparent 8px 12px)' }} aria-hidden="true" />
          {alerts.map((a) => {
            const fresh = a.at > since
            const to = a.kind === 'match' ? '/buyer/offers' : '/buyer/orders'
            const title = a.kind === 'match' ? b('alert.match') : b(ORDER_TEXT[a.order.status])
            const line = a.kind === 'match' ? `${a.listing.species} · ${a.listing.kg} kg` : `${a.order.species} · ${a.order.kg} kg`
            const body = a.kind === 'match' ? b('alert.match.body', { fisher: a.listing.fisher, place: a.listing.place, ask: a.listing.ask }) : `${a.order.fisher} · ${a.order.place}`
            return (
              <li key={a.id} className="relative">
                <span aria-hidden="true" className={`absolute -left-10 top-4 size-8 rounded-full border-2 ${fresh ? 'anim-glow border-coral bg-coral' : 'border-line bg-card'}`} />
                <Link to={to} className={`block space-y-1 rounded-lg border bg-card p-4 shadow-rest ${fresh ? 'border-coral' : 'border-line'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-teal">{title}</p>
                    {fresh && <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-bold text-deep">{b('alerts.new')}</span>}
                  </div>
                  <p className="font-numeral text-xl font-bold leading-tight">{line}</p>
                  <p className="text-sm text-ink-soft">{body}</p>
                  <p className="text-xs font-semibold text-ink-soft">{ago(a.at)}</p>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}