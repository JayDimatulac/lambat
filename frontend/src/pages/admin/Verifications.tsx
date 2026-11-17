import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, MapPin, Pause, PauseCircle, RotateCcw, Search, ShieldCheck, StickyNote, X, XCircle } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import { useAuth } from '../../lib/auth'
import { useT, type Key } from '../../lib/i18n'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import type { Account } from '../../lib/accounts'
import HarborScene from './HarborScene'
import { Chip } from './ui'
import type { Ctx } from './data'

// The approval queue. It reads the REAL buyer accounts, so approving here opens the buyer's pier (even live, in another tab).
type Status = Account['status']
type F = 'all' | Status
type Sort = 'queue' | 'new' | 'old'

const TABS: [F, Key][] = [
  ['all', 'adm.v.tab.all'],
  ['PENDING', 'adm.v.st.PENDING'],
  ['ACTIVE', 'adm.v.st.ACTIVE'],
  ['SUSPENDED', 'adm.v.st.SUSPENDED'],
  ['REJECTED', 'adm.v.st.REJECTED'],
]
const TONE = { PENDING: 'wait', ACTIVE: 'ok', REJECTED: 'no', SUSPENDED: 'warn' } as const
const REASONS: Key[] = ['adm.v.r1', 'adm.v.r2', 'adm.v.r3']
const PAGE = 8
// checkbox | buyer | location | date | status | actions
const COLS = 'lg:grid-cols-[28px_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_130px_176px]'

const initials = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

export default function Verifications() {
  const t = useT()
  const { lang } = useSettings()
  const { accounts, setStatus } = useAuth()
  const { toast } = useOutletContext<Ctx>()
  const [f, setF] = useState<F>('all')
  const [q, setQ] = useState('')
  const [place, setPlace] = useState('')
  const [sort, setSort] = useState<Sort>('queue')
  const [page, setPage] = useState(1)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [rej, setRej] = useState<Account | null>(null)
  const [why, setWhy] = useState('')
  const [leaving, setLeaving] = useState<Account['id'] | null>(null)

  const loc = localeOf(lang)
  const day = (ts: number) => new Date(ts).toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = (ts: number) => new Date(ts).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })

  const buyers = accounts.filter((a) => a.role === 'buyer')
  const count = (s: Status) => buyers.filter((a) => a.status === s).length
  const places = [...new Set(buyers.map((a) => a.buyer?.address?.trim()).filter((x): x is string => !!x))].sort()

  const needle = q.trim().toLowerCase()
  const shown = buyers
    .filter((a) => (f === 'all' || a.status === f) && (!place || a.buyer?.address?.trim() === place))
    .filter((a) => !needle || [a.buyer?.businessName, a.name, a.mobile, a.buyer?.address].some((v) => v?.toLowerCase().includes(needle)))
    .sort((a, b) =>
      sort === 'old' ? a.createdAt - b.createdAt
      : sort === 'new' ? b.createdAt - a.createdAt
      : Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || b.createdAt - a.createdAt)

  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = shown.slice((cur - 1) * PAGE, cur * PAGE)
  const from = shown.length === 0 ? 0 : (cur - 1) * PAGE + 1
  const winStart = Math.max(1, Math.min(cur - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => winStart + i)

  const reset = () => { setPage(1); setPicked(new Set()) }
  const allOnPage = rows.length > 0 && rows.every((a) => picked.has(a.id))
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const togglePage = () => setPicked((s) => { const n = new Set(s); rows.forEach((a) => (allOnPage ? n.delete(a.id) : n.add(a.id))); return n })
  const bulk = buyers.filter((a) => picked.has(a.id) && (a.status === 'PENDING' || a.status === 'SUSPENDED'))

  const done = (a: Account, s: Status, text: string, note?: string) => {
    setStatus(a.id, s, note)
    toast(`${a.buyer?.businessName ?? a.name}: ${text}`)
  }

  // On the waiting or paused tab the row floats away first, so approving feels like a small win
  const approve = (a: Account) => {
    const text = t(a.status === 'SUSPENDED' ? 'adm.v.t.opened' : 'adm.v.t.approved')
    if (f !== 'PENDING' && f !== 'SUSPENDED') return done(a, 'ACTIVE', text)
    setLeaving(a.id)
    window.setTimeout(() => {
      done(a, 'ACTIVE', text)
      setLeaving(null)
    }, 300)
  }
  const approveMany = () => {
    bulk.forEach((a) => setStatus(a.id, 'ACTIVE'))
    toast(`${bulk.length} ${t('adm.v.t.approved')}`)
    setPicked(new Set())
  }

  const stats: { k: Status; icon: typeof ClipboardList; tone: string; label: Key }[] = [
    { k: 'PENDING', icon: ClipboardList, tone: 'bg-seafoam text-teal', label: 'adm.v.st.PENDING' },
    { k: 'ACTIVE', icon: CheckCircle2, tone: 'bg-risk-low-bg text-risk-low', label: 'adm.v.st.ACTIVE' },
    { k: 'SUSPENDED', icon: PauseCircle, tone: 'bg-risk-high-bg text-risk-high', label: 'adm.v.st.SUSPENDED' },
    { k: 'REJECTED', icon: XCircle, tone: 'bg-risk-critical-bg text-risk-critical', label: 'adm.v.st.REJECTED' },
  ]
  const field = 'min-h-12 rounded-full border border-line bg-card px-4 text-sm font-semibold shadow-rest outline-none transition focus:border-teal'

  return (
    <div className="space-y-5">
      {/* Hero: slim, with the harbor behind it */}
      <section className="bg-dawn relative min-h-[140px] overflow-hidden rounded-lg p-5 text-white shadow-raised">
        <div className="relative z-10 flex max-w-xl items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <ShieldCheck size={34} strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <h1 className="font-numeral text-[26px] font-semibold leading-tight">{t('adm.v.title')}</h1>
            <p className="mt-1 text-white/90">{t('adm.v.sub')}</p>
          </div>
        </div>
        <HarborScene />
      </section>

      {/* Counts: tap one to filter the list */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ k, icon: I, tone, label }) => (
          <button key={k} type="button" onClick={() => { setF(k); reset() }}
            className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 text-left shadow-rest transition hover:-translate-y-0.5 hover:shadow-raised">
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${tone}`}><I size={26} strokeWidth={1.8} aria-hidden /></span>
            <span>
              <b className="block font-numeral text-3xl font-bold leading-none">{count(k)}</b>
              <span className="mt-1 block text-sm font-semibold text-ink-soft">{t(label)}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Tabs with counts */}
      <div role="group" aria-label="Filter" className="grid grid-cols-2 gap-1 rounded-3xl border border-line bg-mint p-1 sm:grid-cols-5 sm:rounded-full">
        {TABS.map(([k, label]) => {
          const n = k === 'all' ? buyers.length : count(k)
          return (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => { setF(k); reset() }}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition active:scale-95 ${f === k ? 'bg-teal text-on-accent shadow-rest' : 'text-navy hover:bg-seafoam'}`}>
              {t(label)} <span className={f === k ? 'opacity-80' : 'text-ink-soft'}>({n})</span>
            </button>
          )
        })}
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1">
          <Search size={20} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); reset() }} placeholder="Search by name, business, or location…"
            aria-label="Search buyers" className={`${field} w-full pl-12 font-medium`} />
        </label>
        {places.length > 1 && (
          <label className="relative">
            <MapPin size={18} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-teal" />
            <select value={place} onChange={(e) => { setPlace(e.target.value); reset() }} aria-label="Location" className={`${field} max-w-64 cursor-pointer appearance-none pl-11 pr-10`}>
              <option value="">All locations</option>
              {places.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          </label>
        )}
        <label className="relative">
          <select value={sort} onChange={(e) => { setSort(e.target.value as Sort); reset() }} aria-label="Sort" className={`${field} cursor-pointer appearance-none pl-5 pr-10`}>
            <option value="queue">Waiting first</option>
            <option value="new">Newest registered</option>
            <option value="old">Oldest registered</option>
          </select>
          <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        </label>
      </div>

      {/* Bulk action, only when something is ticked */}
      {picked.size > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-teal/40 bg-seafoam px-4 py-3">
          <b>{picked.size} selected</b>
          {bulk.length > 0 && (
            <button type="button" onClick={approveMany} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-coral px-5 text-sm font-bold text-deep shadow-rest transition hover:bg-peach active:scale-95">
              <Check size={18} strokeWidth={2.4} aria-hidden />{t('adm.v.approve')} ({bulk.length})
            </button>
          )}
          <button type="button" onClick={() => setPicked(new Set())} className="min-h-10 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-card">Clear</button>
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
        <div role="row" className={`hidden items-center gap-4 border-b border-line bg-mint px-5 py-3 text-sm font-bold lg:grid ${COLS}`}>
          <input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select all on this page" className="size-5 cursor-pointer accent-teal" />
          <span>Buyer / Business</span>
          <span>Location</span>
          <span>Date registered</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <ul className="divide-y divide-line">
          {rows.map((a) => {
            const name = a.buyer?.businessName ?? a.name
            const out = leaving === a.id
            return (
              <li key={a.id}
                className={`grid items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-all duration-300 hover:bg-seafoam/30 ${COLS} ${picked.has(a.id) ? 'bg-seafoam/40' : ''} ${out ? 'translate-x-6 opacity-0' : ''}`}>
                <input type="checkbox" checked={picked.has(a.id)} onChange={() => toggle(a.id)} aria-label={`Select ${name}`} className="hidden size-5 cursor-pointer accent-teal lg:block" />

                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-seafoam font-bold text-teal">{initials(name)}</span>
                  <div className="min-w-0">
                    <b className="flex items-center gap-1.5 text-[15px] leading-tight">
                      <span className="truncate">{name}</span>
                      {a.note && <span title={a.note} aria-label={a.note}><StickyNote size={16} strokeWidth={1.8} className="shrink-0 text-ink-soft" /></span>}
                    </b>
                    <p className="truncate text-sm text-ink-soft">{a.name} · {a.mobile}</p>
                  </div>
                </div>

                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <MapPin size={17} strokeWidth={1.8} aria-hidden className="shrink-0 text-teal" />
                  <span className="truncate">{a.buyer?.address || '—'}</span>
                </p>

                <p className="text-sm leading-tight">
                  <span className="block font-semibold">{day(a.createdAt)}</span>
                  <span className="text-ink-soft">{time(a.createdAt)}</span>
                </p>

                <div><Chip tone={TONE[a.status]}>{t(`adm.v.st.${a.status}` as Key)}</Chip></div>

                <div className="flex items-center gap-2">
                  {a.status === 'PENDING' && (
                    <button type="button" onClick={() => { setRej(a); setWhy('') }} title={t('adm.v.reject')} aria-label={t('adm.v.reject.aria', { name })}
                      className="grid size-10 place-items-center rounded-full text-ink-soft transition hover:bg-risk-critical-bg hover:text-risk-critical active:scale-90">
                      <X size={20} strokeWidth={2} />
                    </button>
                  )}
                  {(a.status === 'PENDING' || a.status === 'SUSPENDED') && (
                    <button type="button" onClick={() => approve(a)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-teal px-5 text-sm font-bold text-on-accent shadow-rest transition hover:brightness-110 active:scale-95">
                      <Check size={18} strokeWidth={2.4} aria-hidden />{t('adm.v.approve')}
                    </button>
                  )}
                  {a.status === 'ACTIVE' && (
                    <button type="button" onClick={() => done(a, 'SUSPENDED', t('adm.v.t.paused'))}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-95">
                      <Pause size={16} strokeWidth={2} aria-hidden />{t('adm.v.pause')}
                    </button>
                  )}
                  {a.status === 'REJECTED' && (
                    <button type="button" onClick={() => done(a, 'PENDING', t('adm.v.t.restored'))}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-95">
                      <RotateCcw size={16} strokeWidth={2} aria-hidden />{t('adm.v.restore')}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {shown.length === 0 && (
          <div className="grid place-items-center gap-3 px-6 py-14 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-seafoam text-teal"><Check size={30} strokeWidth={2.2} aria-hidden /></span>
            <p className="font-display text-xl font-bold">{f === 'PENDING' && !needle ? t('adm.v.empty.pending') : t('adm.v.empty')}</p>
            <p className="text-sm text-ink-soft">{f === 'PENDING' && !needle ? t('adm.v.empty.pending.sub') : t('adm.v.empty.sub')}</p>
          </div>
        )}

        {/* Footer: how many, and which page */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <p className="text-sm text-ink-soft">Showing {from}–{from === 0 ? 0 : from + rows.length - 1} of {shown.length} buyers</p>
          {pages > 1 && (
            <nav aria-label="Pages" className="flex items-center gap-1.5">
              <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"
                className="grid size-10 place-items-center rounded-full border border-line transition hover:bg-seafoam/60 disabled:opacity-40"><ChevronLeft size={18} /></button>
              {nums.map((n) => (
                <button key={n} type="button" aria-current={n === cur ? 'page' : undefined} onClick={() => setPage(n)}
                  className={`grid size-10 place-items-center rounded-full border text-sm font-bold transition ${n === cur ? 'border-teal bg-teal text-on-accent' : 'border-line hover:bg-seafoam/60'}`}>{n}</button>
              ))}
              <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"
                className="grid size-10 place-items-center rounded-full border border-line transition hover:bg-seafoam/60 disabled:opacity-40"><ChevronRight size={18} /></button>
            </nav>
          )}
        </div>
      </section>

      <Sheet open={!!rej} onClose={() => setRej(null)} title={t('adm.v.sheet')}>
        <p className="text-sm text-ink-soft">{t('adm.v.sheet.sub')}</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setWhy(t(r))} className="rounded-full border border-line bg-seafoam/40 px-3 py-1.5 text-sm font-semibold">{t(r)}</button>
          ))}
        </div>
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="w-full rounded-md border-2 border-line bg-card p-3 text-base" aria-label={t('adm.v.reason')} />
        <button
          type="button"
          disabled={!why.trim()}
          onClick={() => { if (rej) done(rej, 'REJECTED', t('adm.v.t.rejected'), why.trim()); setRej(null) }}
          className="min-h-12 w-full rounded-full bg-coral font-semibold text-deep disabled:opacity-40"
        >
          {t('adm.v.send')}
        </button>
      </Sheet>
    </div>
  )
}