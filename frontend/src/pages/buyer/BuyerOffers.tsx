import { useState } from 'react'
import { Fish } from 'lucide-react'
import TabBar from '../../components/buyer/TabBar'
import { answerOffer, useBuyerInbox, type InboxOffer } from '../../lib/buyerInbox'
import { useBT, type BKey } from '../../lib/buyerText'

type Tab = 'active' | 'accepted' | 'declined'
const TABS: { id: Tab; label: BKey; status: InboxOffer['status'] }[] = [
  { id: 'active', label: 'c.active', status: 'pending' },
  { id: 'accepted', label: 'c.accepted', status: 'accepted' },
  { id: 'declined', label: 'c.declined', status: 'declined' },
]

export default function BuyerOffers() {
  const b = useBT()
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-[28px]">{b('offers.title')}</h1>
        <p className="text-sm text-ink-soft">{b('offers.sub')}</p>
      </div>

      <TabBar
        label={b('offers.title')}
        value={tab}
        onChange={setTab}
        tabs={TABS.map((x) => ({ id: x.id, label: b(x.label), count: count(x.status) }))}
      />

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-6 text-center text-sm text-ink-soft">{b('offers.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id} className="space-y-3 rounded-lg border border-line bg-card/90 p-4 shadow-rest">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><Fish size={22} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-numeral text-lg font-bold leading-tight">{o.species} · {b('c.kg', { n: o.kg })}</span>
                  <span className="block truncate text-sm text-ink-soft">{o.fisher} · {o.place}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-numeral text-lg font-bold leading-tight text-teal">{b('c.perkg', { n: o.price })}</span>
                  <span className="block text-xs text-ink-soft">{b('c.total', { n: (o.price * o.kg).toLocaleString('en-US') })}</span>
                </span>
              </div>
              {o.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, true)} className="min-h-11 rounded-full bg-teal px-4 text-sm font-semibold text-on-accent transition active:scale-[0.98] disabled:opacity-60">{b('c.accept')}</button>
                  <button type="button" disabled={busyId === o.id} onClick={() => answer(o.id, false)} className="min-h-11 rounded-full border-2 border-coral px-4 text-sm font-semibold text-coral-dark transition active:scale-[0.98] disabled:opacity-60">{b('c.decline')}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}