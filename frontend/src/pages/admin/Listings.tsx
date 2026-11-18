import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { BuoyIcon } from '../../components/icons'
import { BudyongIcon, HourglassTideIcon, StringerIcon } from './AdminIcons'
import { RISK_ORDER, type Draft, type Place, type Risk } from './data'
import { Chip, Empty, PageTitle, Pills, RiskBuoy, RiskTag, SearchBox } from './ui'

type CatchStatus = 'ACTIVE' | 'SOLD' | 'REDISTRIBUTED' | 'PROCESSED' | 'DISCARDED'
type ApiRisk = 'low' | 'moderate' | 'high' | 'critical'

// one row of GET /admin/catches
type AdminCatch = {
  id: string
  kilos: number
  place: string | null
  status: CatchStatus
  user: { name: string; mobile: string; barangay: string }
  species: { englishName: string }
  assessment: {
    risk: ApiRisk | null
    iceLevel: string | null
    leftMinHours: number | null
    leftMaxHours: number | null
    hoursMin: number | null
    hoursMax: number | null
  } | null
  _count?: { offers: number }
}

type Row = {
  id: string
  fish: string
  kg: number
  fisher: string
  town: string
  risk: Risk | null
  left: string
  leftMin: number | null
  status: CatchStatus
  offers: number
  ice: string | null
}

const RISKS: [Risk, string][] = [['crit', 'Critical'], ['high', 'High'], ['mod', 'Moderate'], ['low', 'Low']]
const TO_RISK: Record<ApiRisk, Risk> = { low: 'low', moderate: 'mod', high: 'high', critical: 'crit' }
const ICE: Record<string, string> = { none: 'No ice', low: 'Little ice', fair: 'Some ice', good: 'Good ice', plenty: 'Plenty of ice' }
const STATUS_LABEL: Record<CatchStatus, string> = { ACTIVE: 'Active', SOLD: 'Sold', REDISTRIBUTED: 'Shared', PROCESSED: 'Processed', DISCARDED: 'Lost' }
const FILTERS: (CatchStatus | 'all')[] = ['ACTIVE', 'SOLD', 'REDISTRIBUTED', 'PROCESSED', 'DISCARDED', 'all']

const placeOf = (town: string): Place =>
  /balayan|calaca|lemery|taal/i.test(town) ? 'Balayan Bay'
  : /calatagan/i.test(town) ? 'Calatagan coast'
  : /nasugbu|lian|tuy/i.test(town) ? 'Nasugbu coast'
  : 'All 1st District'

function leftLabel(a: AdminCatch['assessment']): string {
  if (!a || a.risk === null || a.leftMaxHours === null) return 'No estimate yet'
  if (a.leftMaxHours <= 0) return 'Past its shelf life'
  if (a.leftMaxHours < 1) return '< 1 hr left'
  const lo = a.hoursMin ?? 0
  const hi = a.hoursMax ?? lo
  return lo === hi ? `${lo} hrs left` : `${lo}–${hi} hrs left`
}

function toRow(c: AdminCatch): Row {
  const active = c.status === 'ACTIVE'
  const a = active ? c.assessment : null
  return {
    id: c.id,
    fish: c.species.englishName,
    kg: Math.round(c.kilos * 10) / 10,
    fisher: c.user.name,
    town: (c.place ?? c.user.barangay ?? '').trim() || 'Unknown',
    risk: a?.risk ? TO_RISK[a.risk] : null,
    left: active ? leftLabel(c.assessment) : 'Closed',
    leftMin: a?.leftMinHours ?? null,
    status: c.status,
    offers: c._count?.offers ?? 0,
    ice: a?.iceLevel ? ICE[a.iceLevel] ?? null : null,
  }
}

function statusChip(r: Row): { tone: 'ok' | 'wait' | 'info'; text: string } {
  if (r.status === 'SOLD') return { tone: 'ok', text: 'Sold' }
  if (r.status === 'REDISTRIBUTED') return { tone: 'ok', text: 'Shared' }
  if (r.status === 'PROCESSED') return { tone: 'ok', text: 'Processed' }
  if (r.status === 'DISCARDED') return { tone: 'wait', text: 'Lost' }
  if (r.offers > 0) return { tone: 'info', text: `${r.offers} ${r.offers === 1 ? 'offer' : 'offers'}` }
  return { tone: 'wait', text: 'No offers yet' }
}

export default function Listings() {
  const navigate = useNavigate()
  const [all, setAll] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [risk, setRisk] = useState<Risk | 'all'>('all')
  const [status, setStatus] = useState<CatchStatus | 'all'>('ACTIVE')
  const [q, setQ] = useState('')

  // load now, then every minute, because the risk of a catch changes as the hours pass
  useEffect(() => {
    const load = () =>
      api
        .get<AdminCatch[]>('/admin/catches?limit=200')
        .then((rows) => {
          setAll(rows.map(toRow))
          setError(null)
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load catches'))
    void load()
    const t = setInterval(() => void load(), 60_000)
    return () => clearInterval(t)
  }, [])

  const rowsAll = all ?? []
  const activeRows = rowsAll.filter((r) => r.status === 'ACTIVE')
  const countOf = (s: CatchStatus | 'all') => (s === 'all' ? rowsAll.length : rowsAll.filter((r) => r.status === s).length)

  const rows = rowsAll
    .filter((r) => (status === 'all' || r.status === status) && (risk === 'all' || r.risk === risk) && `${r.fish} ${r.fisher} ${r.town}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (a.risk ? RISK_ORDER[a.risk] : 9) - (b.risk ? RISK_ORDER[b.risk] : 9) || (a.leftMin ?? 1e9) - (b.leftMin ?? 1e9))

  // Opens the advisory screen with the message already written
  const alertFor = (r: Row) => {
    const draft: Draft = {
      text: `${r.fish}, ${r.kg} kg near ${r.town}, is running out of time. Sell or hand over now. For planning only.`.slice(0, 160),
      type: 'Spoilage alert', place: placeOf(r.town), sev: r.risk === 'crit' ? 'warning' : 'watch',
    }
    navigate('/admin/advisories', { state: { draft } })
  }

  if (error && all === null) return <p className="p-6 text-risk-high">{error}</p>
  if (all === null) return <p className="p-6 text-ink-soft">Loading the catches…</p>

  return (
    <div>
      <PageTitle title="Catches" sub="Every catch logged on the pier. The ones sinking fastest come first." />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {RISKS.map(([r, label]) => (
          <button key={r} type="button" aria-pressed={risk === r} onClick={() => { setRisk(risk === r ? 'all' : r); setStatus('ACTIVE') }}
            className="flex items-center gap-3 rounded-lg border border-line bg-card p-3 text-left shadow-rest transition hover:-translate-y-0.5 aria-pressed:border-teal aria-pressed:bg-seafoam">
            <span className="grid size-12 place-items-center rounded-full bg-mint text-teal"><RiskBuoy risk={r} size={28} /></span>
            <span><b className="block font-numeral text-2xl leading-none">{activeRows.filter((l) => l.risk === r).length}</b><span className="text-sm text-ink-soft">{label}</span></span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Pills<CatchStatus | 'all'> label="Status" value={status} onChange={setStatus}
          options={FILTERS.map((s) => ({ value: s, label: s === 'all' ? 'All' : STATUS_LABEL[s], count: countOf(s) }))} />
        <SearchBox value={q} onChange={setQ} placeholder="Search fish, fisher or town" />
      </div>

      {rows.length === 0 ? (
        <Empty icon={StringerIcon} title="No catches match" sub="Clear a filter to see more." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((l) => {
            const chip = statusChip(l)
            return (
              <article key={l.id} className="anim-rise flex flex-col gap-3 rounded-lg border border-line bg-card p-4 shadow-rest">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-numeral text-2xl font-bold leading-tight">{l.fish}</h3>
                    <p className="text-sm text-ink-soft">{l.kg} kg · {l.fisher}</p>
                  </div>
                  {l.risk && <RiskTag risk={l.risk} />}
                </div>
                <p className="flex items-center gap-2 text-sm"><BuoyIcon size={18} className="text-teal" />{l.town}</p>
                <p className="flex items-center gap-2 text-sm font-semibold"><HourglassTideIcon size={18} className="text-teal" />{l.left}</p>
                <div className="flex flex-wrap gap-2">
                  {l.ice && <Chip tone="info">{l.ice}</Chip>}
                  <Chip tone={chip.tone}>{chip.text}</Chip>
                </div>
                {(l.risk === 'crit' || l.risk === 'high') && (
                  <button type="button" onClick={() => alertFor(l)}
                    className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-coral px-4 text-sm font-semibold text-deep transition hover:bg-coral-dark hover:text-white active:scale-[0.97]">
                    <BudyongIcon size={20} />Warn the area
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}