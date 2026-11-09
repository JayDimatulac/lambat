import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, Pause, RotateCcw, X } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import { useAuth } from '../../lib/auth'
import { useT, type Key } from '../../lib/i18n'
import { localeOf } from '../../lib/time'
import { useSettings } from '../../lib/settings'
import type { Account } from '../../lib/accounts'
import type { Ctx } from './data'

// The approval queue. It reads the REAL buyer accounts, so approving here opens the buyer's pier (even live, in another tab).
type F = 'all' | 'PENDING' | 'ACTIVE' | 'OTHER'
const TABS: [F, Key][] = [
  ['all', 'adm.v.tab.all'],
  ['PENDING', 'adm.v.tab.pending'],
  ['ACTIVE', 'adm.v.tab.active'],
  ['OTHER', 'adm.v.tab.other'],
]
const DOT = {
  PENDING: 'bg-risk-moderate-line',
  ACTIVE: 'bg-risk-low-line',
  REJECTED: 'bg-risk-critical-line',
  SUSPENDED: 'bg-risk-critical-line',
} as const
const REASONS: Key[] = ['adm.v.r1', 'adm.v.r2', 'adm.v.r3']

const initials = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

const spring = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]'

export default function Verifications() {
  const t = useT()
  const { lang } = useSettings()
  const { accounts, setStatus } = useAuth()
  const { toast } = useOutletContext<Ctx>()
  const [f, setF] = useState<F>('all')
  const [rej, setRej] = useState<Account | null>(null)
  const [why, setWhy] = useState('')
  const [leaving, setLeaving] = useState<Account['id'] | null>(null)

  const ago = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86_400_000)
    if (days <= 0) return t('adm.v.today')
    if (days === 1) return t('adm.v.yesterday')
    if (days < 30) return t('adm.v.daysago', { n: days })
    return new Date(ts).toLocaleDateString(localeOf(lang), { month: 'short', day: 'numeric' })
  }

  const buyers = accounts
    .filter((a) => a.role === 'buyer')
    .sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || b.createdAt - a.createdAt)
  const pending = buyers.filter((a) => a.status === 'PENDING').length
  const shown = buyers.filter((a) => {
    if (f === 'all') return true
    if (f === 'OTHER') return a.status === 'REJECTED' || a.status === 'SUSPENDED'
    return a.status === f
  })
  const tab = TABS.findIndex(([k]) => k === f)

  const done = (a: Account, s: Account['status'], text: string, note?: string) => {
    setStatus(a.id, s, note)
    toast(`${a.buyer?.businessName ?? a.name}: ${text}`)
  }

  // On the waiting or inactive tab the card floats away first, so approving feels like a small win
  const approve = (a: Account) => {
    const text = t(a.status === 'SUSPENDED' ? 'adm.v.t.opened' : 'adm.v.t.approved')
    if (f !== 'PENDING' && f !== 'OTHER') return done(a, 'ACTIVE', text)
    setLeaving(a.id)
    window.setTimeout(() => {
      done(a, 'ACTIVE', text)
      setLeaving(null)
    }, 300)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold">{t('adm.v.title')}</h2>
        <p className="mt-1 text-ink-soft">{t('adm.v.sub')}</p>
      </div>

      {/* Sliding tabs */}
      <div role="group" aria-label="Filter" className="relative grid grid-cols-4 rounded-full border border-line bg-mint p-1">
        <span
          aria-hidden="true"
          className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-teal shadow-rest transition-transform duration-300 ${spring}`}
          style={{ transform: `translateX(${tab * 100}%)` }}
        />
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={f === k}
            onClick={() => setF(k)}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition-colors duration-300 active:scale-95 ${f === k ? 'text-on-accent' : 'text-navy hover:text-teal'}`}
          >
            <span className="truncate">{t(label)}</span>
            {k === 'PENDING' && pending > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-xs font-bold text-deep">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Buyers */}
      <ul className="space-y-3">
        {shown.map((a) => {
          const name = a.buyer?.businessName ?? a.name
          const place = [a.buyer?.buyerType, a.buyer?.address].filter(Boolean).join(' · ')
          const out = leaving === a.id
          return (
            <li
              key={a.id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-rest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised ${
                a.status === 'PENDING' ? 'border-coral/40' : 'border-line'
              } ${out ? 'translate-x-6 scale-95 opacity-0' : ''}`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-seafoam font-bold text-teal">{initials(name)}</span>

              <div className="min-w-0 flex-1 basis-48">
                <div className="flex flex-wrap items-center gap-x-2.5">
                  <b className="truncate text-lg leading-tight">{name}</b>
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                    <span aria-hidden="true" className={`size-2 rounded-full ${DOT[a.status]}`} />
                    {t(`adm.v.st.${a.status}` as Key)}
                  </span>
                </div>
                {place && <p className="mt-0.5 truncate text-sm capitalize text-ink-soft">{place}</p>}
                <p className="mt-0.5 text-xs text-ink-soft">{a.name} · {a.mobile} · {ago(a.createdAt)}</p>
                {a.note && <p className="mt-1.5 text-sm italic leading-snug text-ink-soft">“{a.note}”</p>}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {a.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => { setRej(a); setWhy('') }}
                    className="grid size-11 place-items-center rounded-full text-ink-soft transition hover:bg-risk-critical-bg hover:text-risk-critical active:scale-90"
                    aria-label={t('adm.v.reject.aria', { name })}
                    title={t('adm.v.reject')}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                )}
                {(a.status === 'PENDING' || a.status === 'SUSPENDED') && (
                  <button
                    type="button"
                    onClick={() => approve(a)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 text-base font-bold text-deep shadow-raised transition hover:bg-peach active:scale-95"
                  >
                    <Check size={20} strokeWidth={2.4} aria-hidden />
                    {t('adm.v.approve')}
                  </button>
                )}
                {a.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => done(a, 'SUSPENDED', t('adm.v.t.paused'))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-95"
                  >
                    <Pause size={16} strokeWidth={2} aria-hidden />
                    {t('adm.v.pause')}
                  </button>
                )}
                {a.status === 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => done(a, 'PENDING', t('adm.v.t.restored'))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold transition hover:bg-seafoam/60 active:scale-95"
                  >
                    <RotateCcw size={16} strokeWidth={2} aria-hidden />
                    {t('adm.v.restore')}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-seafoam text-teal">
            <Check size={30} strokeWidth={2.2} aria-hidden />
          </span>
          <p className="font-display text-xl font-bold">{f === 'PENDING' ? t('adm.v.empty.pending') : t('adm.v.empty')}</p>
          <p className="text-sm text-ink-soft">{f === 'PENDING' ? t('adm.v.empty.pending.sub') : t('adm.v.empty.sub')}</p>
        </div>
      )}

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