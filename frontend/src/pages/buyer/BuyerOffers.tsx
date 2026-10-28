import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OfferCard from '../../components/buyer/OfferCard'
import OfferSheet from '../../components/buyer/OfferSheet'
import Chip from '../../components/ui/Chip'
import Segmented from '../../components/ui/Segmented'
import Disclaimer from '../../components/ui/Disclaimer'
import { useUser } from '../../lib/auth'
import { openListings, useMarket, type Listing } from '../../lib/market'
import { useBT } from '../../lib/buyerText'
import { useT } from '../../lib/i18n'

type Sort = 'urgent' | 'price' | 'size'

export default function BuyerOffers() {
  const b = useBT()
  const t = useT()
  const user = useUser()
  const navigate = useNavigate()
  const m = useMarket()
  const [fish, setFish] = useState('')
  const [sort, setSort] = useState<Sort>('urgent')
  const [pick, setPick] = useState<{ l: Listing; mode: 'buy' | 'offer' } | null>(null)

  const open = openListings(m)
  const species = [...new Set(open.map((l) => l.species))]
  const needs = m.needs.filter((n) => n.buyerId === user.id && n.open)
  const list = open.filter((l) => !fish || l.species === fish).sort((x, y) => (sort === 'price' ? x.ask - y.ask : sort === 'size' ? y.kg - x.kg : x.deadline - y.deadline))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px]">{b('offers.title')}</h1>
        <p className="text-ink-soft">{b('offers.sub')}</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!fish} onClick={() => setFish('')} className="shrink-0">{b('offers.all')}</Chip>
        {species.map((s) => <Chip key={s} active={fish === s} onClick={() => setFish(s)} className="shrink-0">{s}</Chip>)}
      </div>
      <Segmented<Sort> label={b('offers.sort')} value={sort} onChange={setSort} options={[{ value: 'urgent', label: b('sort.urgent') }, { value: 'price', label: b('sort.price') }, { value: 'size', label: b('sort.size') }]} />

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{b('offers.empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((l) => (
            <OfferCard key={l.id} l={l} now={m.now}
              match={needs.some((n) => n.species === l.species && (!n.maxPrice || l.ask <= n.maxPrice))}
              onBuy={() => setPick({ l, mode: 'buy' })} onOffer={() => setPick({ l, mode: 'offer' })} />
          ))}
        </div>
      )}
      <Disclaimer>{t('buyers.note')}</Disclaimer>

      <OfferSheet key={pick ? `${pick.l.id}:${pick.mode}` : 'none'} l={pick?.l ?? null} mode={pick?.mode ?? 'buy'} onClose={() => setPick(null)}
        onConfirm={(price) => { if (pick) { m.buy(pick.l.id, user.id, price); setPick(null); navigate('/buyer/orders') } }} />
    </div>
  )
}