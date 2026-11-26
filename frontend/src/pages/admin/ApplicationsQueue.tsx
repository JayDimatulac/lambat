import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Layers, Pause, RotateCcw, Search, Store, User, Users, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useT, type Key } from '../../lib/i18n'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import type { Account } from '../../lib/accounts'
import { kindOfAccount, missingCount, pick, reqOf, requirementRows } from '../../lib/buyerKinds'
import { Badge, Modal, Seg } from './AdminBits'
import { Chip } from './ui'
import { useA } from './adminText'
import type { Ctx } from './data'
import { DAY, ROLE_LABEL, STATUS_LABEL, areaOf, refOf } from './adminStats'

type Status = Account['status']
type F = 'all' | Status
type RoleF = 'all' | 'fisherfolk' | 'buyer' | 'organization'
type Range = 'all' | 'today' | '7' | '30'
type Tab = 'details' | 'req'

const TONE = { PENDING: 'wait', ACTIVE: 'ok', REJECTED: 'no', SUSPENDED: 'warn' } as const
const REASONS: Key[] = ['adm.v.r1', 'adm.v.r2', 'adm.v.r3']
const ICON = { fisherfolk: User, buyer: Store, organization: Users } as const
const ROLE_CHIP: Record<string, string> = {
  fisherfolk: 'bg-seafoam text-teal',
  buyer: 'bg-risk-low-bg text-risk-low',
  organization: 'bg-risk-moderate-bg text-risk-moderate',
}
// applicant | role | submitted | status | review
const COLS = 'lg:grid-cols-[minmax(0,2fr)_150px_minmax(0,1fr)_120px_110px]'
const field = 'min-h-11 rounded-lg border border-line bg-mint px-3 text-sm font-semibold outline-none transition focus:border-teal'
const since = (r: Range) => (r === 'all' ? 0 : r === 'today' ? new Date().setHours(0, 0, 0, 0) : Date.now() - Number(r) * DAY)

export default function ApplicationsQueue({ area = '', pageSize = 8 }: { area?: string; pageSize?: number }) {
  const t = useT()
  const A = useA()
  const { lang } = useSettings()
  const { accounts, setStatus } = useAuth()
  const { toast } = useOutletContext<Ctx>()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<F>('all')
  const [role, setRole] = useState<RoleF>('all')
  const [range, setRange] = useState<Range>('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Account | null>(null)
  const [tab, setTab] = useState<Tab>('details')
  const [rejecting, setRejecting] = useState(false)
  const [why, setWhy] = useState('')

  const loc = localeOf(lang)
  const day = (ts: number) => new Date(ts).toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = (ts: number) => new Date(ts).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })

  const everyone = accounts.filter((a) => a.role === 'fisherfolk' || a.role === 'buyer' || a.role === 'organization')
  const needle = q.trim().toLowerCase()
  const cutoff = since(range)

  const shown = everyone
    .filter((a) => (!area || areaOf(a) === area) && (st === 'all' || a.status === st) && (role === 'all' || a.role === role) && a.createdAt >= cutoff)
    .filter((a) => !needle || [a.buyer?.businessName, a.name, a.mobile, refOf(a)].some((v) => v?.toLowerCase().includes(needle)))
    .sort((a, b) => {
      // review order: waiting first, the longest wait on top
      const aw = a.status === 'PENDING'
      const bw = b.status === 'PENDING'
      if (aw !== bw) return aw ? -1 : 1
      return aw ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
    })

  const pages = Math.max(1, Math.ceil(shown.length / pageSize))
  const cur = Math.min(page, pages)
  const rows = shown.slice((cur - 1) * pageSize, cur * pageSize)
  const from = shown.length === 0 ? 0 : (cur - 1) * pageSize + 1
  const winStart = Math.max(1, Math.min(cur - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => winStart + i)
  const filtered = st !== 'all' || role !== 'all' || range !== 'all' || !!needle

  const close = () => { setOpen(null); setRejecting(false); setWhy(''); setTab('details') }
  const decide = (a: Account, s: Status, text: string, note?: string) => {
    setStatus(a.id, s, note)
    toast(`${a.buyer?.businessName ?? a.name}: ${text}`)
    close()
  }
  const reset = () => { setQ(''); setSt('all'); setRole('all'); setRange('all'); setPage(1) }

  // what the open application needs, and what the buyer entered
  const openKind = open ? kindOfAccount(open) : undefined
  const openReq = open ? reqOf(open) : undefined
  const reqRows = open?.role === 'buyer' ? requirementRows(openKind, openReq, lang) : []
  const missing = missingCount(reqRows)

  const details = (a: Account): [string, string][] => [
    ['Reference', refOf(a)],
    ['Role', ROLE_LABEL[a.role] ?? a.role],
    ['Name', a.name],
    ['Mobile', a.mobile || '—'],
    ['Area', areaOf(a)],
    ...(a.role === 'buyer'
      ? ([
          ['Business', a.buyer?.businessName ?? '—'],
          ['Category', openKind ? pick(openKind, lang) : a.buyer?.buyerType ?? '—'],
          ['Address', a.buyer?.address || '—'],
        ] as [string, string][])
      : []),
    ...(a.role === 'fisherfolk'
      ? ([
          ['Landing site', a.fisher?.landing || '—'],
          ['Boat', a.fisher?.boat ?? '—'],
          ['Gear', a.fisher?.gear?.length ? a.fisher.gear.join(', ') : '—'],
        ] as [string, string][])
      : []),
    ['Submitted', `${day(a.createdAt)} · ${time(a.createdAt)}`],
    ...(a.note ? ([['Earlier note', a.note]] as [string, string][]) : []),
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
      <div className="flex items-start gap-3 px-5 pt-5">
        <Layers size={26} strokeWidth={1.8} aria-hidden className="mt-0.5 shrink-0 text-teal" />
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight">Applications Queue</h2>
          <p className="text-sm text-ink-soft">Review and take action on submitted fisheries applications.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-5">
        <label className="relative min-w-56 flex-1">
          <Search size={18} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search applicant or reference no."
            aria-label="Search applications" className={`${field} w-full pl-10`} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          Status
          <span className="relative">
            <select value={st} onChange={(e) => { setSt(e.target.value as F); setPage(1) }} className={`${field} cursor-pointer appearance-none pr-9 text-navy`}>
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Paused</option>
            </select>
            <ChevronDown size={15} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </span>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          Role
          <span className="relative">
            <select value={role} onChange={(e) => { setRole(e.target.value as RoleF); setPage(1) }} className={`${field} cursor-pointer appearance-none pr-9 text-navy`}>
              <option value="all">All Roles</option>
              <option value="fisherfolk">Fisherfolk</option>
              <option value="buyer">Business Buyer</option>
              <option value="organization">Organization</option>
            </select>
            <ChevronDown size={15} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </span>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          Date Range
          <span className="relative">
            <select value={range} onChange={(e) => { setRange(e.target.value as Range); setPage(1) }} className={`${field} cursor-pointer appearance-none pr-9 text-navy`}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <ChevronDown size={15} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </span>
        </label>
        <button type="button" onClick={reset} disabled={!filtered}
          className="min-h-11 rounded-lg bg-mint px-4 text-sm font-semibold text-ink-soft transition hover:bg-seafoam/60 disabled:opacity-50">Reset</button>
      </div>

      {/* Table */}
      <div role="row" className={`hidden items-center gap-4 border-y border-line bg-mint px-5 py-3 text-sm font-bold lg:grid ${COLS}`}>
        <span>Applicant</span>
        <span>Role</span>
        <span>Submitted</span>
        <span>Status</span>
        <span className="text-right">Review</span>
      </div>

      <ul className="divide-y divide-line">
        {rows.map((a) => {
          const name = a.buyer?.businessName ?? a.name
          const I = ICON[a.role as keyof typeof ICON]
          const k = a.role === 'buyer' ? kindOfAccount(a) : undefined
          const sub = a.role === 'buyer' ? (k ? pick(k, lang) : refOf(a)) : areaOf(a)
          return (
            <li key={a.id} className={`grid items-center gap-x-4 gap-y-3 px-5 py-3.5 transition hover:bg-seafoam/30 ${COLS}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-seafoam text-teal"><I size={22} strokeWidth={1.8} aria-hidden /></span>
                <div className="min-w-0">
                  <b className="block truncate text-[15px] leading-tight">{name}</b>
                  <p className="truncate text-sm text-ink-soft">{sub}</p>
                </div>
              </div>

              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ROLE_CHIP[a.role] ?? 'bg-seafoam text-teal'}`}>{ROLE_LABEL[a.role] ?? a.role}</span>
              </div>

              <p className="text-sm leading-tight">
                <span className="block font-semibold">{day(a.createdAt)}</span>
                <span className="text-ink-soft">{time(a.createdAt)}</span>
              </p>

              <div><Chip tone={TONE[a.status]}>{STATUS_LABEL[a.status]}</Chip></div>

              <div className="lg:text-right">
                <button type="button" onClick={() => { setOpen(a); setTab('details') }} aria-label={`Review ${name}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal px-4 text-sm font-bold text-on-accent shadow-rest transition hover:brightness-110 active:scale-95">
                  Review <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <div className="grid place-items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-seafoam text-teal"><Check size={28} strokeWidth={2.2} aria-hidden /></span>
          <p className="font-display text-xl font-bold">{filtered ? t('adm.v.empty') : t('adm.v.empty.pending')}</p>
          <p className="text-sm text-ink-soft">{filtered ? t('adm.v.empty.sub') : t('adm.v.empty.pending.sub')}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
        <p className="text-sm text-ink-soft">Showing {from}–{from === 0 ? 0 : from + rows.length - 1} of {shown.length} applications</p>
        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center gap-1.5">
            <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"
              className="grid size-10 place-items-center rounded-lg border border-line transition hover:bg-seafoam/60 disabled:opacity-40"><ChevronLeft size={18} /></button>
            {nums.map((n) => (
              <button key={n} type="button" aria-current={n === cur ? 'page' : undefined} onClick={() => setPage(n)}
                className={`grid size-10 place-items-center rounded-lg border text-sm font-bold transition ${n === cur ? 'border-teal bg-teal text-on-accent' : 'border-line hover:bg-seafoam/60'}`}>{n}</button>
            ))}
            <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"
              className="grid size-10 place-items-center rounded-lg border border-line transition hover:bg-seafoam/60 disabled:opacity-40"><ChevronRight size={18} /></button>
          </nav>
        )}
      </div>

      {/* Review dialog: the details, what the buyer submitted, then the decision */}
      <Modal open={!!open} onClose={close} title={open ? (open.buyer?.businessName ?? open.name) : ''} wide>
        {open && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={TONE[open.status]}>{STATUS_LABEL[open.status]}</Chip>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ROLE_CHIP[open.role] ?? 'bg-seafoam text-teal'}`}>{ROLE_LABEL[open.role] ?? open.role}</span>
            </div>

            {open.role === 'buyer' && (
              <div>
                <Seg<Tab>
                  value={tab}
                  onChange={setTab}
                  items={[
                    { k: 'details', label: A('rv.details') },
                    { k: 'req', label: A('rv.requirements'), ...(missing > 0 ? { n: missing } : {}) },
                  ]}
                />
              </div>
            )}

            {tab === 'req' && open.role === 'buyer' ? (
              <>
                <div className="overflow-hidden rounded-lg border border-line">
                  <div className="flex items-center justify-between gap-3 bg-mint px-4 py-3">
                    <b className="min-w-0 truncate">{openKind ? pick(openKind, lang) : open.buyer?.buyerType ?? A('rv.requirements')}</b>
                    <Badge tone={missing === 0 ? 'green' : 'amber'}>{missing === 0 ? A('rv.complete') : A('rv.missing', { n: missing })}</Badge>
                  </div>
                  <dl className="divide-y divide-line text-sm">
                    {reqRows.map((r) => (
                      <div key={r.key} className="flex items-start justify-between gap-4 px-4 py-3">
                        <dt className="text-ink-soft">{r.label}{r.required ? ' *' : ''}</dt>
                        <dd className={`text-right font-semibold ${r.value ? '' : 'text-ink-soft'}`}>{r.value ?? A('rv.missingval')}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {!openReq && <p className="text-sm text-ink-soft">{A('rv.legacy')}</p>}
              </>
            ) : (
              <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {details(open).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="shrink-0 text-ink-soft">{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {open.role !== 'buyer' ? (
              <p className="rounded-md border border-dashed border-line p-3 text-sm text-ink-soft">
                {open.role === 'fisherfolk' ? 'Fisherfolk accounts are approved automatically for now. A review step is coming.' : 'Organization accounts are created by an admin, so there is nothing to approve.'}
              </p>
            ) : rejecting ? (
              <>
                <p className="text-sm text-ink-soft">{t('adm.v.sheet.sub')}</p>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => setWhy(t(r))} className="rounded-full border border-line bg-seafoam/40 px-3 py-1.5 text-sm font-semibold">{t(r)}</button>
                  ))}
                </div>
                <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="w-full rounded-md border-2 border-line bg-card p-3 text-base" aria-label={t('adm.v.reason')} />
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRejecting(false)} className="min-h-12 rounded-full border border-line font-semibold">Back</button>
                  <button type="button" disabled={!why.trim()} onClick={() => decide(open, 'REJECTED', t('adm.v.t.rejected'), why.trim())}
                    className="min-h-12 rounded-full bg-coral font-semibold text-deep disabled:opacity-40">{t('adm.v.send')}</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                {(open.status === 'PENDING' || open.status === 'SUSPENDED') && (
                  <button type="button" onClick={() => decide(open, 'ACTIVE', t(open.status === 'SUSPENDED' ? 'adm.v.t.opened' : 'adm.v.t.approved'))}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-teal font-bold text-on-accent shadow-rest transition hover:brightness-110">
                    <Check size={20} strokeWidth={2.4} aria-hidden />{t('adm.v.approve')}
                  </button>
                )}
                {open.status === 'PENDING' && (
                  <button type="button" disabled title="Needs the correction status, added with the verification records"
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line font-semibold opacity-40">
                    Request correction
                  </button>
                )}
                {open.status === 'PENDING' && (
                  <button type="button" onClick={() => { setRejecting(true); setWhy('') }}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-risk-critical-line font-bold text-risk-critical transition hover:bg-risk-critical-bg">
                    <X size={20} strokeWidth={2.4} aria-hidden />{t('adm.v.reject')}
                  </button>
                )}
                {open.status === 'ACTIVE' && (
                  <button type="button" onClick={() => decide(open, 'SUSPENDED', t('adm.v.t.paused'))}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line font-semibold transition hover:bg-seafoam/60">
                    <Pause size={18} strokeWidth={2} aria-hidden />{t('adm.v.pause')}
                  </button>
                )}
                {open.status === 'REJECTED' && (
                  <button type="button" onClick={() => decide(open, 'PENDING', t('adm.v.t.restored'))}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line font-semibold transition hover:bg-seafoam/60">
                    <RotateCcw size={18} strokeWidth={2} aria-hidden />{t('adm.v.restore')}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </section>
  )
}