import { useState } from 'react'
import { Fish } from 'lucide-react'
import { answerOffer, useBuyerInbox, type InboxOffer } from '../../lib/buyerInbox'

type Tab = 'active' | 'accepted' | 'declined'
const TABS: { id: Tab; label: string; status: InboxOffer['status'] }[] = [
  { id: 'active', label: 'Active', status: 'pending' },
  { id: 'accepted', label: 'Accepted', status: 'accepted' },
  { id: 'declined', label: 'Declined', status: 'declined' },
]

export default function BuyerOffers() {
  const { offers } = useBuyerInbox()
  const [tab, setTab] = useState<Tab>('active')
  const [busyId, setBusyId] = useState<string | null>(null)
  const status = TABS.find((x) => x.id === tab)!.status
  const list = offers.filter((o) => o.status === status).sort((a, c) => c.createdAt - a.createdAt)
  const count = (s: InboxOffer['status']) => offers.filter((o) => o.status === s).length

  const answer = async (id: string, accept: boolean) => {
    setBusyId(id)
    try { await answerOffer(id, accept) } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px]">Offers</h1>
        <p className="text-sm text-ink-soft">Offers you've received</p>
      </div>

      <div role="tablist" aria-label="Offers" className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${tab === x.id ? 'border-teal bg-teal text-on-accent' : 'border-line bg-card/80 text-navy hover:bg-seafoam'}`}>
            {x.label} ({count(x.status)})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">No offers here yet. Post a need and fisherfolk will answer it.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card/90 p-4 shadow-rest">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><Fish size={24} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-numeral text-lg font-bold leading-tight">{o.species} · {o.kg} kg</span>
                <span className="block truncate text-sm text-ink-soft">{o.fisher} · {o.place}</span>
              </span>
              <span className="text-right">
                <span className="block font-numeral text-lg font-bold text-teal">₱{o.price}/kg</span>
                <span className="block text-xs text-ink-soft">Total: ₱{(o.price * o.kg).toLocaleString('en-US')}</span>
              </span>
              {o.status === 'pending' && (
                <span className="flex gap-2">
                  <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, true)} className="min-h-11 rounded-full bg-teal px-5 text-sm font-semibold text-on-accent transition active:scale-[0.98] disabled:opacity-60">Accept</button>
                  <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, false)} className="min-h-11 rounded-full border-2 border-coral px-5 text-sm font-semibold text-coral-dark transition active:scale-[0.98] disabled:opacity-60">Decline</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}