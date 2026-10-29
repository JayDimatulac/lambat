import { Link } from 'react-router-dom'
import { HornIcon } from '../buyer/BuyerIcons'
import type { Catch } from '../../data/mock'
import { useAuth, useUser } from '../../lib/auth'
import { useMarket } from '../../lib/market'
import { useBT } from '../../lib/buyerText'

/* Shown on a catch when an approved buyer has said they need this fish. One tap offers the catch to them. */
export default function NeedAlert({ c }: { c: Catch }) {
  const b = useBT()
  const user = useUser()
  const { accounts } = useAuth()
  const m = useMarket()

  const found = m.needs
    .filter((n) => n.open && n.species === c.species)
    .flatMap((n) => {
      const a = accounts.find((x) => x.id === n.buyerId && x.role === 'buyer' && x.status === 'ACTIVE')
      return a ? [{ n, a }] : []
    })
  if (found.length === 0) return null
  const sent = m.listings.some((l) => l.id === `${user.id}:${c.id}`)

  return (
    <section className="rounded-lg border-2 border-coral bg-card p-4 shadow-raised">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-deep"><HornIcon size={28} /></span>
        <div className="min-w-0 flex-1 space-y-3">
          <h2 className="font-numeral text-xl font-bold leading-tight">{b('fneed.title', { species: c.species })}</h2>
          <ul className="space-y-1 text-sm">
            {found.slice(0, 2).map(({ n, a }) => (
              <li key={n.id}>
                <b>{a.buyer?.businessName ?? a.name}</b> · {b('needs.line', { kg: n.kg, when: b(`when.${n.when}` as 'when.today') })}
                {n.maxPrice ? ` · ${b('needs.upto', { n: n.maxPrice })}` : ''}
              </li>
            ))}
          </ul>
          {sent ? (
            <p role="status" className="rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">{b('fneed.sent')}</p>
          ) : (
            <button type="button" onClick={() => m.postListing(c, user.shortName, user.id)} className="min-h-12 w-full rounded-full bg-coral text-sm font-semibold text-deep transition active:scale-[0.98]">{b('fneed.offer')}</button>
          )}
          <Link to={`/buyers?catch=${c.id}`} className="inline-flex min-h-12 items-center text-sm font-semibold text-teal">{b('fneed.others')}</Link>
        </div>
      </div>
    </section>
  )
}