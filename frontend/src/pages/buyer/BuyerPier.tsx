import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Search } from 'lucide-react'
import FilterMenu from '../../components/buyer/FilterMenu'
import FishPhoto from '../../components/buyer/FishPhoto'
import { hoursLeft, openListings, useMarket, type Listing } from '../../lib/market'
import { useBT, type BKey } from '../../lib/buyerText'

type Sort = 'newest' | 'price' | 'kg'

const SAVED_KEY = 'lambat.buyer.saved'
const loadSaved = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') } catch { return [] }
}

/* The little label on the photo: how fresh or how limited the catch is */
function badgeOf(l: Listing, now: number): { key: BKey; cls: string } {
  const hrs = hoursLeft(l, now)
  if (hrs <= 6) return { key: 'offer.rescue', cls: 'bg-cream text-deep' }
  if ((now - l.postedAt) / 3_600_000 <= 2) return { key: 'badge.new', cls: 'bg-risk-low-bg text-risk-low' }
  return { key: 'offer.fresh', cls: 'bg-seafoam text-teal' }
}

export default function BuyerPier() {
  const b = useBT()
  const m = useMarket()
  const navigate = useNavigate()
  const open = openListings(m)
  const [q, setQ] = useState('')
  const [species, setSpecies] = useState('all')
  const [place, setPlace] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0) // 0 means any price
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
    .sort((a, c) => (sort === 'price' ? a.ask - c.ask : sort === 'kg' ? c.kg - a.kg : c.postedAt - a.postedAt))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-[28px]">{b('nav.pantalan')}</h1>
        <p className="text-sm text-ink-soft">{b('pier.sub')}</p>
      </div>

      {/* Search, then filters. On a phone the filters scroll sideways and open as a sheet from the bottom. */}
      <div className="space-y-2 rounded-3xl border border-line bg-card/90 p-2 shadow-rest">
        <label className="flex min-h-11 items-center gap-2 rounded-full bg-mint px-4">
          <Search size={18} strokeWidth={1.8} className="shrink-0 text-teal" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={b('pier.search')} aria-label={b('pier.search')} className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-ink-soft sm:text-sm" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          <FilterMenu
            title={b('pier.species')}
            value={species}
            onChange={setSpecies}
            buttonLabel={species === 'all' ? b('pier.species') : species}
            options={[{ value: 'all', label: b('pier.allspecies') }, ...speciesList.map((s) => ({ value: s, label: s }))]}
          />
          <FilterMenu
            title={b('pier.place')}
            value={place}
            onChange={setPlace}
            buttonLabel={place === 'all' ? b('pier.place') : place}
            options={[{ value: 'all', label: b('pier.allplaces') }, ...placeList.map((p) => ({ value: p, label: p }))]}
          />
          <FilterMenu
            title={b('pier.price')}
            value={maxPrice}
            onChange={setMaxPrice}
            buttonLabel={maxPrice === 0 ? b('pier.price') : b('pier.upto', { n: maxPrice })}
            options={[{ value: 0, label: b('pier.anyprice') }, ...[100, 150, 200, 300].map((p) => ({ value: p, label: b('pier.upto', { n: p }) }))]}
          />
          <FilterMenu
            title={b('pier.sort')}
            value={sort}
            onChange={setSort}
            align="right"
            options={[
              { value: 'newest' as Sort, label: b('sort.newest') },
              { value: 'price' as Sort, label: b('sort.price') },
              { value: 'kg' as Sort, label: b('sort.size') },
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-6 text-center text-sm text-ink-soft">{b('pier.empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((l) => {
            const badge = badgeOf(l, m.now)
            const isSaved = saved.includes(l.id)
            return (
              <article key={l.id} className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
                <div className="relative">
                  <FishPhoto species={l.species} className="h-36 w-full sm:h-40" />
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>{b(badge.key)}</span>
                  <button
                    type="button"
                    onClick={() => toggleSaved(l.id)}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? b('pier.unsave') : b('pier.save')}
                    className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-card/90 text-coral-dark shadow-rest"
                  >
                    <Heart size={20} strokeWidth={1.8} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-numeral text-xl font-bold leading-tight">{l.species}</h3>
                      <p className="truncate text-sm text-ink-soft">{l.fisher} · {l.place}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-numeral text-xl font-bold leading-tight text-teal">{b('c.perkg', { n: l.ask })}</p>
                      <p className="text-xs text-ink-soft">{b('pier.kgleft', { n: l.kg })}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/buyer/offers')}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-sm font-semibold text-teal transition active:scale-[0.98]"
                  >
                    {b('pier.view')} <ArrowRight size={16} aria-hidden="true" />
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