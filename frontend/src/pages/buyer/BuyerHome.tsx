import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PierScene from '../../components/buyer/PierScene'
import OfferCard from '../../components/buyer/OfferCard'
import RopeTimeline from '../../components/buyer/RopeTimeline'
import { LifebuoyIcon } from '../../components/buyer/BuyerIcons'
import { KnotPlusIcon } from '../../components/icons'
import { useUser } from '../../lib/auth'
import { openListings, riskOf, useMarket } from '../../lib/market'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import { useBT } from '../../lib/buyerText'

export default function BuyerHome() {
  const b = useBT()
  const navigate = useNavigate()
  const { lang } = useSettings()
  const user = useUser()
  const m = useMarket()
  const open = openListings(m)
  const mine = m.orders.filter((o) => o.buyerId === user.id)
  const live = mine.filter((o) => o.status === 'confirmed' || o.status === 'onway')
  const rescuedKg = mine.filter((o) => o.status === 'received' && o.rescue).reduce((n, o) => n + o.kg, 0)
  const urgent = open.filter((l) => ['critical', 'high'].includes(riskOf(l, m.now))).slice(0, 2)
  const needs = m.needs.filter((n) => n.buyerId === user.id && n.open)
  const date = new Date().toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' })
  const matchOf = (species: string, maxPrice?: number) => open.filter((l) => l.species === species && (!maxPrice || l.ask <= maxPrice)).length

  const header = (
    <>
      <p className="pt-1 text-sm font-medium text-white">{date}</p>
      <p className="mt-0.5 text-xs font-medium text-white">{user.buyer?.businessName}</p>
      <p className="mt-1 font-numeral text-[24px] font-bold leading-tight text-white">{b('home.hello')}, {user.shortName}</p>
      <p className="text-sm text-white/90">{b('home.sub')}</p>
    </>
  )

  const stat = (n: string | number, label: string, hot?: boolean) => (
    <div className={`rounded-lg border p-3 text-center ${hot ? 'border-coral bg-card' : 'border-line bg-card'}`}>
      <p className={`font-numeral text-3xl font-extrabold leading-none ${hot ? 'text-coral-dark' : 'text-teal'}`}>{n}</p>
      <p className="mt-1 text-xs font-semibold text-ink-soft">{label}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <PierScene lots={open.map((l) => ({ id: l.id, risk: riskOf(l, m.now) }))} header={header} />

      <div className="grid grid-cols-3 gap-3">
        {stat(open.length, b('home.stat.open'))}
        {stat(live.length, b('home.stat.onway'))}
        {stat(`${rescuedKg} kg`, b('home.stat.rescue'), rescuedKg > 0)}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl"><LifebuoyIcon size={26} className="text-coral" />{b('home.urgent')}</h2>
          <p className="text-sm text-ink-soft">{b('home.urgent.sub')}</p>
        </div>
        {urgent.length === 0 ? <p className="rounded-md border border-dashed border-line bg-card p-6 text-center text-ink-soft">{b('home.empty')}</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {urgent.map((l) => <OfferCard key={l.id} l={l} now={m.now} onBuy={() => navigate('/buyer/offers')} onOffer={() => navigate('/buyer/offers')} />)}
          </div>
        )}
        <Link to="/buyer/offers" className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">{b('home.seeall')}<ArrowRight size={18} strokeWidth={1.8} aria-hidden /></Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">{b('home.needs')}</h2>
        {needs.length === 0 ? (
          <Link to="/buyer/needs?new=1" className="flex items-center gap-3 rounded-lg border-2 border-dashed border-teal bg-seafoam/40 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-deep"><KnotPlusIcon size={26} /></span>
            <span><span className="block font-numeral text-lg font-bold">{b('home.needs.add')}</span><span className="text-sm text-ink-soft">{b('home.needs.none')}</span></span>
          </Link>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {needs.slice(0, 4).map((n) => {
              const k = matchOf(n.species, n.maxPrice)
              return (
                <Link key={n.id} to="/buyer/needs" className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card p-4 shadow-rest">
                  <span><span className="block font-numeral text-xl font-bold">{n.species} · {n.kg} kg</span><span className="text-sm text-ink-soft">{b(`when.${n.when}` as 'when.today')}</span></span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${k ? 'bg-seafoam text-teal' : 'bg-mint text-ink-soft'}`}>{k ? b('home.needs.match', { n: k }) : b('home.needs.nomatch')}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {live.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">{b('home.orders')}</h2>
          {live.slice(0, 2).map((o) => (
            <Link key={o.id} to="/buyer/orders" className="block space-y-3 rounded-lg border border-line bg-card p-4 shadow-rest">
              <p className="font-numeral text-lg font-bold">{o.species} · {o.kg} {b('unit.kg')} <span className="text-sm font-medium text-ink-soft">· {o.fisher}</span></p>
              <RopeTimeline status={o.status} />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}