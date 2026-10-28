import { useState } from 'react'
import { Link } from 'react-router-dom'
import RopeTimeline from '../../components/buyer/RopeTimeline'
import Segmented from '../../components/ui/Segmented'
import { LifebuoyIcon } from '../../components/buyer/BuyerIcons'
import { useUser } from '../../lib/auth'
import { useMarket, type Order } from '../../lib/market'
import { useBT } from '../../lib/buyerText'

export default function BuyerOrders() {
  const b = useBT()
  const user = useUser()
  const m = useMarket()
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const mine = m.orders.filter((o) => o.buyerId === user.id)
  const list = mine.filter((o) => (tab === 'done' ? o.status === 'received' || o.status === 'declined' : o.status !== 'received' && o.status !== 'declined'))

  const card = (o: Order) => (
    <article key={o.id} className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-numeral text-xl font-bold leading-tight">{o.species} · {o.kg} {b('unit.kg')}</h3>
          <p className="text-sm text-ink-soft">{o.fisher} · {o.place}</p>
        </div>
        <div className="text-right">
          <p className="font-numeral text-xl font-extrabold text-teal">₱{o.price}/kg</p>
          <p className="text-xs font-semibold text-ink-soft">{b('order.total', { n: (o.price * o.kg).toLocaleString('en-US') })}</p>
        </div>
      </div>
      {o.rescue && <p className="inline-flex items-center gap-1.5 rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal"><LifebuoyIcon size={16} />{b('order.rescued')}</p>}

      {o.status === 'offered' && <p role="status" className="anim-glow rounded-md bg-risk-moderate-bg p-3 text-sm font-semibold text-risk-moderate">{b('order.waiting')}</p>}
      {o.status === 'declined' && (
        <div className="space-y-2">
          <p className="rounded-md bg-risk-critical-bg p-3 text-sm font-semibold text-risk-critical">{b('order.declined')}</p>
          <Link to="/buyer/offers" className="inline-flex min-h-12 items-center rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">{b('order.tryother')}</Link>
        </div>
      )}
      {(o.status === 'confirmed' || o.status === 'onway' || o.status === 'received') && <RopeTimeline status={o.status} />}
      {(o.status === 'confirmed' || o.status === 'onway') && (
        <button type="button" onClick={() => m.advance(o.id)} className="min-h-12 w-full rounded-full bg-coral text-sm font-semibold text-deep transition active:scale-[0.98]">
          {o.status === 'confirmed' ? b('order.go') : b('order.got')}
        </button>
      )}
    </article>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-[28px]">{b('orders.title')}</h1>
      <Segmented<'active' | 'done'> label={b('orders.title')} value={tab} onChange={setTab} options={[{ value: 'active', label: b('orders.active') }, { value: 'done', label: b('orders.done') }]} />
      {list.length === 0 ? <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{b('orders.empty')}</p> : <div className="grid gap-4 md:grid-cols-2">{list.map(card)}</div>}
    </div>
  )
}