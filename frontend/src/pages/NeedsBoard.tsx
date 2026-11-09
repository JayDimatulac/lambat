import { useState } from 'react'
import Button from '../components/ui/Button'
import { byUrgency, isActive } from '../data/mock'
import { useCatches } from '../data/store'
import { useUser } from '../lib/auth'
import { useMarket, usualPrice, type Need } from '../lib/market'

const WHEN: Record<Need['when'], string> = { today: 'Today', tomorrow: 'Tomorrow', week: 'This week' }
const field = 'min-h-12 w-full rounded-md border border-line bg-mint px-3 text-base font-semibold'

function NeedCard({ need }: { need: Need }) {
  const user = useUser()
  const { catches } = useCatches()
  const { offers, offerToNeed } = useMarket()

  const mine = catches.filter(isActive).filter((c) => c.species === need.species).sort(byUrgency)
  const sent = offers.filter((o) => o.needId === need.id && o.fisherId === user.id).sort((a, b) => b.createdAt - a.createdAt)[0]
  const live = sent && sent.status !== 'declined'

  const [catchId, setCatchId] = useState(mine[0]?.id ?? '')
  const chosen = mine.find((c) => c.id === catchId) ?? mine[0]
  const [kg, setKg] = useState(String(Math.min(need.kg, chosen?.kg ?? need.kg)))
  const [price, setPrice] = useState(String(need.maxPrice ?? usualPrice(need.species)))

  const send = () => {
    if (!chosen) return
    const k = Math.min(chosen.kg, Math.max(1, parseInt(kg, 10) || 1))
    const p = Math.max(1, parseInt(price, 10) || 1)
    offerToNeed(need.id, { fisherId: user.id, fisher: user.shortName, catchId: chosen.id, species: chosen.species, kg: k, place: chosen.place, price: p })
  }

  return (
    <article className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-rest">
      <div>
        <h3 className="font-numeral text-xl font-bold">{need.species} · {need.kg} kg</h3>
        <p className="text-sm text-ink-soft">
          {need.buyer ?? 'A buyer'} · {WHEN[need.when]}{need.maxPrice ? ` · up to ₱${need.maxPrice}/kg` : ''}
        </p>
      </div>

      {live ? (
        <p className="rounded-md bg-seafoam p-3 text-sm font-semibold text-teal">
          {sent.status === 'accepted' ? 'Accepted' : 'Offer sent, waiting for the buyer'} · {sent.kg} kg at ₱{sent.price}/kg
        </p>
      ) : mine.length === 0 ? (
        <p className="rounded-md bg-mint p-3 text-sm text-ink-soft">You have no active {need.species} catch to offer.</p>
      ) : (
        <div className="space-y-3">
          {sent && <p className="text-sm font-semibold text-risk-critical">Your last offer was declined. You can send a new one.</p>}
          <label className="block space-y-1 text-sm font-semibold">
            Which catch?
            <select value={chosen?.id} onChange={(e) => setCatchId(e.target.value)} className={field}>
              {mine.map((c) => <option key={c.id} value={c.id}>{c.species} · {c.kg} kg</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm font-semibold">
              Kilos
              <input inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))} className={field} />
            </label>
            <label className="block space-y-1 text-sm font-semibold">
              Your price (₱/kg)
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} className={field} />
            </label>
          </div>
          <Button className="min-h-14 w-full text-base" onClick={send}>Send offer</Button>
        </div>
      )}
    </article>
  )
}

export default function NeedsBoard() {
  const { needs } = useMarket()
  const open = needs.filter((n) => n.open)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px]">What buyers need</h1>
        <p className="text-ink-soft">Offer your catch to a buyer who is looking for it.</p>
      </div>
      {open.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">No buyer needs right now.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{open.map((n) => <NeedCard key={n.id} need={n} />)}</div>
      )}
    </div>
  )
}