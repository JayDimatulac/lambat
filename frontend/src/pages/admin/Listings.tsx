import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuoyIcon } from '../../components/icons'
import { BudyongIcon, HourglassTideIcon, StringerIcon } from './AdminIcons'
import { LISTINGS, LISTING_TYPES, RISK_ORDER, type Draft, type Listing, type ListingType, type Place, type Risk } from './data'
import { Chip, Empty, PageTitle, Pills, RiskBuoy, RiskTag, SearchBox } from './ui'

const RISKS: [Risk, string][] = [['crit', 'Critical'], ['high', 'High'], ['mod', 'Moderate'], ['low', 'Low']]

const placeOf = (town: string): Place =>
  town === 'Batangas City' ? 'Batangas Bay' : town === 'Calatagan' ? 'Calatagan coast' : town === 'Taal Lake' ? 'Taal Lake' : 'All Batangas'
const statusTone = (s: string) => (s === 'Sold' || s.startsWith('Accepted') ? 'ok' : s === 'No response' ? 'wait' : 'info')

export default function Listings() {
  const navigate = useNavigate()
  const [risk, setRisk] = useState<Risk | 'all'>('all')
  const [type, setType] = useState<ListingType | 'all'>('all')
  const [q, setQ] = useState('')

  const rows = LISTINGS
    .filter((l) => (risk === 'all' || l.risk === risk) && (type === 'all' || l.type === type) && `${l.fish} ${l.fisher} ${l.town}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])

  // Opens the advisory screen with the message already written
  const alertFor = (l: Listing) => {
    const draft: Draft = {
      text: `${l.fish}, ${l.kg} kg near ${l.town}, is running out of time. Sell or hand over now. For planning only.`,
      type: 'Spoilage alert', place: placeOf(l.town), sev: l.risk === 'crit' ? 'warning' : 'watch',
    }
    navigate('/admin/advisories', { state: { draft } })
  }

  return (
    <div>
      <PageTitle title="Catches" sub="Fish listed for sale or redistribution. The ones sinking fastest come first." />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {RISKS.map(([r, label]) => (
          <button key={r} type="button" aria-pressed={risk === r} onClick={() => setRisk(risk === r ? 'all' : r)}
            className="flex items-center gap-3 rounded-lg border border-line bg-card p-3 text-left shadow-rest transition hover:-translate-y-0.5 aria-pressed:border-teal aria-pressed:bg-seafoam">
            <span className="grid size-12 place-items-center rounded-full bg-mint text-teal"><RiskBuoy risk={r} size={28} /></span>
            <span><b className="block font-numeral text-2xl leading-none">{LISTINGS.filter((l) => l.risk === r).length}</b><span className="text-sm text-ink-soft">{label}</span></span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Pills<ListingType | 'all'> label="Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All' }, ...LISTING_TYPES.map((t) => ({ value: t, label: t }))]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search fish, fisher or town" />
      </div>

      {rows.length === 0 ? (
        <Empty icon={StringerIcon} title="No catches match" sub="Clear a filter to see more." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((l) => (
            <article key={l.id} className="anim-rise flex flex-col gap-3 rounded-lg border border-line bg-card p-4 shadow-rest">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-numeral text-2xl font-bold leading-tight">{l.fish}</h3>
                  <p className="text-sm text-ink-soft">{l.kg} kg · {l.fisher}</p>
                </div>
                <RiskTag risk={l.risk} />
              </div>
              <p className="flex items-center gap-2 text-sm"><BuoyIcon size={18} className="text-teal" />{l.town}</p>
              <p className="flex items-center gap-2 text-sm font-semibold"><HourglassTideIcon size={18} className="text-teal" />{l.left === '—' ? 'Closed' : `${l.left} left`}</p>
              <div className="flex flex-wrap gap-2"><Chip tone="info">{l.type}</Chip><Chip tone={statusTone(l.status)}>{l.status}</Chip></div>
              {(l.risk === 'crit' || l.risk === 'high') && (
                <button type="button" onClick={() => alertFor(l)}
                  className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-coral px-4 text-sm font-semibold text-deep transition hover:bg-coral-dark hover:text-white active:scale-[0.97]">
                  <BudyongIcon size={20} />Warn the area
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}