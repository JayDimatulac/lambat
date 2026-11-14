import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Search } from 'lucide-react'
import FishPhoto from '../../components/buyer/FishPhoto'
import { hoursLeft, openListings, useMarket, type Listing } from '../../lib/market'

type Sort = 'newest' | 'price' | 'kg'

const SAVED_KEY = 'lambat.buyer.saved'
const loadSaved = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') } catch { return [] }
}

function badgeOf(l: Listing, now: number) {
  const hrs = hoursLeft(l, now)
  if (hrs <= 6) return { text: 'Limited', cls: 'bg-cream text-deep' }
  if ((now - l.postedAt) / 3_600_000 <= 2) return { text: 'New', cls: 'bg-risk-low-bg text-risk-low' }
  return { text: 'Fresh', cls: 'bg-seafoam text-teal' }
}

const select = 'min-h-11 rounded-full border border-line bg-card px-3 text-sm font-semibold text-navy'

export default function BuyerPier() {
  const m = useMarket()
  const navigate = useNavigate()
  const open = openListings(m)
  const [q, setQ] = useState('')
  const [species, setSpecies] = useState('all')
  const [place, setPlace] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0)
  const [sort, setSort] = useState<Sort>('newest')
  const [saved, setSaved] = useState<string[]>(loadSaved)

  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id]
    setSaved(next)
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)) } catch { /* storage can be blocked */ }
  }

  const speciesList = useMemo(() => [...new Set(open.map((l) => l.species))].sort(), [open])
  const placeList = useMemo(() => [...new Set(open.map((l) => l.place))].sort(), [open])

  const list = open
    .filter((l) => species === 'all' || l.species === species)
    .filter((l) => place === 'all' || l.place === place)
    .filter((l) => !maxPrice || l.ask <= maxPrice)
    .filter((l) => !q.trim() || `${l.species} ${l.place} ${l.fisher}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (sort === 'price' ? a.ask - b.ask : sort === 'kg' ? b.kg - a.kg : b.postedAt - a.postedAt))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px]">Pier</h1>
        <p className="text-sm text-ink-soft">Nearby catch from registered fisherfolk</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-card/80 p-2 shadow-rest backdrop-blur-md">
        <label className="flex min-h-11 min-w-48 flex-1 items-center gap-2 rounded-full bg-mint px-4">
          <Search size={18} strokeWidth={1.8} className="text-teal" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by fish, location, or seller..." aria-label="Search" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft" />
        </label>
        <select aria-label="Species" value={species} onChange={(e) => setSpecies(e.target.value)} className={select}>
          <option value="all">Species</option>
          {speciesList.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select aria-label="Location" value={place} onChange={(e) => setPlace(e.target.value)} className={select}>
          <option value="all">Location</option>
          {placeList.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Price" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className={select}>
          <option value={0}>Price</option>
          {[100, 150, 200, 300].map((p) => <option key={p} value={p}>Up to ₱{p}/kg</option>)}
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
          <option value="newest">Sort: Newest</option>
          <option value="price">Sort: Lowest price</option>
          <option value="kg">Sort: Biggest lot</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">No catch matches right now. Try clearing a filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((l) => {
            const badge = badgeOf(l, m.now)
            const isSaved = saved.includes(l.id)
            return (
              <article key={l.id} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
                <div className="relative">
                  <FishPhoto species={l.species} className="h-40 w-full" />
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>{badge.text}</span>
                  <button type="button" onClick={() => toggleSaved(l.id)} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from saved' : 'Save this catch'}
                    className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 text-coral-dark shadow-rest">
                    <Heart size={18} strokeWidth={1.8} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-numeral text-xl font-bold leading-tight">{l.species}</h3>
                      <p className="text-xs text-ink-soft">Fresh catch · {l.place}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-numeral text-xl font-bold leading-tight text-teal">₱{l.ask}/kg</p>
                      <p className="text-xs text-ink-soft">{l.kg} kg available</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-sm">
                    <span className="grid size-8 place-items-center rounded-full bg-seafoam text-xs font-bold text-teal">{l.fisher.slice(0, 1)}</span>
                    <span className="min-w-0"><span className="block truncate font-semibold leading-tight">{l.fisher}</span><span className="block text-xs text-ink-soft">Fisherfolk</span></span>
                  </p>
                  <button type="button" onClick={() => navigate('/buyer/offers')}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-sm font-semibold text-teal transition active:scale-[0.98]">
                    View Offer <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}