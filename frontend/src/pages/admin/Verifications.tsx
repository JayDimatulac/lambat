import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Sheet from '../../components/ui/Sheet'
import { useAuth } from '../../lib/auth'
import type { Account } from '../../lib/accounts'
import type { Ctx } from './data'

// The approval queue. It reads the REAL buyer accounts, so approving here opens the buyer's pier (even live, in another tab).
// Self-contained on purpose: it uses only Tailwind classes, so changes to admin/ui.tsx cannot break it.
type F = 'all' | 'PENDING' | 'ACTIVE' | 'REJECTED'
const LABEL = { PENDING: 'Naghihintay', ACTIVE: 'Aprubado', REJECTED: 'Hindi inaprubahan', SUSPENDED: 'Naka-pause' } as const
const TONE = {
  PENDING: 'bg-risk-moderate-bg text-risk-moderate',
  ACTIVE: 'bg-risk-low-bg text-risk-low',
  REJECTED: 'bg-risk-critical-bg text-risk-critical',
  SUSPENDED: 'bg-risk-critical-bg text-risk-critical',
} as const
const REASONS = ['Hindi malinaw ang address ng negosyo.', 'Kulang ang pangalan ng negosyo.', 'Hindi ma-verify ang mobile number.']
const FILTERS: [F, string][] = [['all', 'Lahat'], ['PENDING', 'Naghihintay'], ['ACTIVE', 'Aprubado'], ['REJECTED', 'Hindi inaprubahan']]

export default function Verifications() {
  const { accounts, setStatus } = useAuth()
  const { toast } = useOutletContext<Ctx>()
  const [f, setF] = useState<F>('all')
  const [rej, setRej] = useState<Account | null>(null)
  const [why, setWhy] = useState('')

  const buyers = accounts.filter((a) => a.role === 'buyer').sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING') || b.createdAt - a.createdAt)
  const shown = buyers.filter((a) => f === 'all' || a.status === f)
  const btn = 'min-h-10 rounded-full px-4 text-[13px] font-semibold'
  const done = (a: Account, s: Account['status'], text: string, note?: string) => { setStatus(a.id, s, note); toast(`${a.buyer?.businessName ?? a.name}: ${text}`) }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-card p-5 shadow-rest">
      <div>
        <h2 className="text-2xl">Pag-apruba ng mamimili</h2>
        <p className="text-sm text-ink-soft">Hangga’t hindi aprubado, hindi mabubuksan ng mamimili ang pantalan at hindi sila makakakita ng mga alok.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}
            className="min-h-10 rounded-full border border-line bg-mint px-4 text-sm font-semibold aria-pressed:border-teal aria-pressed:bg-teal aria-pressed:text-on-accent">
            {label}{k === 'all' ? ` (${buyers.length})` : ` (${buyers.filter((a) => a.status === k).length})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr>{['Negosyo', 'Uri', 'Lugar', 'Nag-apply', 'Status', ''].map((h, i) => <th key={i} className="border-b border-line px-3 py-2.5 text-left text-[13px] font-semibold text-ink-soft">{h}</th>)}</tr>
          </thead>
          <tbody className="[&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_td]:align-top [&_tr:last-child_td]:border-0">
            {shown.map((a) => (
              <tr key={a.id}>
                <td><b>{a.buyer?.businessName ?? '—'}</b><div className="text-xs text-ink-soft">{a.name} · {a.mobile}</div></td>
                <td>{a.buyer?.buyerType}</td>
                <td>{a.buyer?.address}</td>
                <td>{new Date(a.createdAt).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}</td>
                <td>
                  <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${TONE[a.status]}`}>{LABEL[a.status]}</span>
                  {a.note && <div className="mt-1 max-w-48 text-xs text-ink-soft">{a.note}</div>}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {a.status === 'PENDING' && <>
                      <button type="button" onClick={() => done(a, 'ACTIVE', 'aprubado na')} className={`${btn} bg-coral text-deep hover:bg-coral-dark`}>Aprubahan</button>
                      <button type="button" onClick={() => { setRej(a); setWhy('') }} className={`${btn} border-[1.5px] border-risk-critical-line text-risk-critical`}>Tanggihan</button>
                    </>}
                    {a.status === 'ACTIVE' && <button type="button" onClick={() => done(a, 'SUSPENDED', 'na-pause')} className={`${btn} border border-line`}>I-pause</button>}
                    {(a.status === 'REJECTED' || a.status === 'SUSPENDED') && <button type="button" onClick={() => done(a, 'PENDING', 'ibinalik sa naghihintay')} className={`${btn} border border-line`}>Ibalik sa naghihintay</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className="p-6 text-center text-ink-soft">Walang nasa listahang ito.</p>}

      <Sheet open={!!rej} onClose={() => setRej(null)} title="Bakit hindi inaprubahan?">
        <p className="text-sm text-ink-soft">Makikita ito ng mamimili, para maayos niya at makapag-apply ulit.</p>
        <div className="flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} type="button" onClick={() => setWhy(r)} className="rounded-full border border-line bg-seafoam/40 px-3 py-1.5 text-sm font-semibold">{r}</button>)}</div>
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="w-full rounded-md border-2 border-line bg-card p-3 text-base" aria-label="Dahilan" />
        <button type="button" disabled={!why.trim()} onClick={() => { if (rej) done(rej, 'REJECTED', 'hindi inaprubahan', why.trim()); setRej(null) }} className="min-h-12 w-full rounded-full bg-coral font-semibold text-deep disabled:opacity-40">Tanggihan at ipaalam</button>
      </Sheet>
    </section>
  )
}