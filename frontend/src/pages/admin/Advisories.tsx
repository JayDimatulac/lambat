import { useCallback, useEffect, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api'
import { whenLabel } from '../../lib/adminApi'
import { BudyongIcon } from './AdminIcons'
import { ADVISORY_TYPES, PLACES, TEMPLATES, type AdvisoryType, type Ctx, type Draft, type Place, type Sev } from './data'
import { Card, Head, PageTitle, Pills, field } from './ui'

const MAX = 160

type ApiSeverity = 'INFO' | 'WARNING' | 'DANGER'
type Advisory = {
  id: string
  title: string
  body: string
  severity: ApiSeverity
  audience: string | null
  active: boolean
  expiresAt: string | null
  createdAt: string
  createdBy: { id: string; name: string }
}
type SentResult = Advisory & { notified: number }

// the three flags on this page map to the three severities the server stores
const TO_API: Record<Sev, ApiSeverity> = { calm: 'INFO', watch: 'WARNING', warning: 'DANGER' }
const FROM_API: Record<ApiSeverity, Sev> = { INFO: 'calm', WARNING: 'watch', DANGER: 'warning' }

// Storm-signal flags: the color says how serious it is
const SEV: Record<Sev, { label: string; hint: string; color: string }> = {
  calm: { label: 'Calm', hint: 'Good to know', color: 'var(--color-risk-low-line)' },
  watch: { label: 'Watch', hint: 'Stay alert', color: 'var(--color-risk-moderate-line)' },
  warning: { label: 'Warning', hint: 'Act now', color: 'var(--color-risk-critical-line)' },
}

function Pennant({ sev, size = 28 }: { sev: Sev; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3V21" />
      <path d="M6 5C10 3 14 7 19 5V13C14 15 10 11 6 13" style={{ fill: SEV[sev].color }} />
    </svg>
  )
}

export default function Advisories() {
  const { toast } = useOutletContext<Ctx>()
  const { state } = useLocation()
  const draft = (state as { draft?: Draft } | null)?.draft
  const [sev, setSev] = useState<Sev>(draft?.sev ?? 'watch')
  const [type, setType] = useState<AdvisoryType>(draft?.type ?? 'Weather / sea condition')
  const [place, setPlace] = useState<Place>(draft?.place ?? 'Balayan Bay')
  const [text, setText] = useState(draft?.text ?? '')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const [log, setLog] = useState<Advisory[] | null>(null)
  const [logErr, setLogErr] = useState<string | null>(null)
  const [reach, setReach] = useState<number | null>(null)

  const loadLog = useCallback(
    () =>
      api
        .get<Advisory[]>('/advisories/all')
        .then((rows) => {
          setLog(rows)
          setLogErr(null)
        })
        .catch((e: unknown) => setLogErr(e instanceof Error ? e.message : 'Could not load advisories')),
    [],
  )

  useEffect(() => {
    void loadLog()
    // how many active fisherfolk will get the alert
    api
      .get<unknown[]>('/admin/users?role=FISHERFOLK&status=ACTIVE')
      .then((rows) => setReach(rows.length))
      .catch(() => setReach(null))
  }, [loadLog])

  const C = 2 * Math.PI * 14
  const pct = Math.min(text.length / MAX, 1)

  const send = async () => {
    if (!text.trim()) { setErr(true); toast('Write the message first'); return }
    setErr(false)
    setBusy(true)
    try {
      const sent = await api.post<SentResult>('/advisories', {
        title: `${type} · ${place}`,
        body: text.trim(),
        severity: TO_API[sev],
        audience: 'FISHERFOLK',
      })
      setText('')
      toast(`Advisory sent to ${sent.notified} fisherfolk`)
      await loadLog()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not send the advisory')
    } finally {
      setBusy(false)
    }
  }

  const switchOff = async (id: string) => {
    try {
      await api.patch(`/advisories/${id}/deactivate`)
      toast('Advisory switched off')
      await loadLog()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not switch it off')
    }
  }

  return (
    <div>
      <PageTitle title="Advisories" sub="Blow the budyong: warn fisherfolk with an alert in the app." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Head icon={BudyongIcon} title="New advisory" sub="Pick how serious it is, which area to name, then write." />

          <p className="mb-2 text-sm font-semibold">How serious?</p>
          <div role="radiogroup" aria-label="Severity" className="grid grid-cols-3 gap-2">
            {(Object.keys(SEV) as Sev[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={sev === s} onClick={() => setSev(s)}
                className="flex flex-col items-center gap-0.5 rounded-md border-[1.5px] border-line bg-mint px-2 py-3 text-center transition aria-checked:border-teal aria-checked:bg-seafoam">
                <Pennant sev={s} size={30} />
                <span className="text-sm font-semibold">{SEV[s].label}</span>
                <span className="text-xs text-ink-soft">{SEV[s].hint}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-sm font-semibold">Type</p>
          <Pills<AdvisoryType> label="Type" value={type} onChange={setType} options={ADVISORY_TYPES.map((t) => ({ value: t, label: t }))} />
          <p className="mb-2 mt-4 text-sm font-semibold">Area to name</p>
          <Pills<Place> label="Place" value={place} onChange={setPlace} options={PLACES.map((p) => ({ value: p, label: p }))} />

          <p className="mb-2 mt-4 text-sm font-semibold">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES[type].map((t) => (
              <button key={t} type="button" onClick={() => { setText(t); setErr(false) }}
                className="rounded-full border border-dashed border-line px-3 py-1.5 text-left text-xs font-semibold text-ink-soft hover:bg-seafoam/50">{t}</button>
            ))}
          </div>

          <label htmlFor="adv-text" className="mb-2 mt-4 block text-sm font-semibold">Message</label>
          <textarea id="adv-text" maxLength={MAX} value={text} onChange={(e) => { setText(e.target.value); setErr(false) }}
            placeholder="Example: Strong wind until 6:00 PM. For planning only."
            className={`${field} min-h-[96px] resize-y ${err ? 'border-risk-critical-line' : ''}`} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs italic text-ink-soft">{text.length} / {MAX} characters</p>
            <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-line)" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ stroke: pct >= 1 ? 'var(--color-coral)' : 'var(--color-teal)', transition: 'stroke-dashoffset 0.2s' }} />
            </svg>
          </div>

          <div className="mt-3 rounded-md bg-mint p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider text-teal"><Pennant sev={sev} size={18} />LAMBAT · {SEV[sev].label.toUpperCase()}</p>
            <p className="text-xs text-ink-soft">{type} · {place}</p>
            <p className="text-sm">{text.trim() || 'Your message will appear here.'}</p>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {reach === null ? 'Goes to all active fisherfolk.' : <>Goes to all <b className="text-navy">{reach.toLocaleString('en-PH')}</b> active fisherfolk.</>}
            {' '}The area is named in the alert. SMS is not available yet.
          </p>

          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busy} onClick={() => void send()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 text-sm font-semibold text-deep transition hover:bg-coral-dark hover:text-white active:scale-[0.97] disabled:opacity-60">
              <BudyongIcon size={20} />{busy ? 'Sending…' : 'Send advisory'}
            </button>
            <button type="button" onClick={() => { setText(''); setErr(false) }} className="min-h-12 rounded-full border-[1.5px] border-teal px-5 text-sm font-semibold text-teal hover:bg-seafoam/50">Clear</button>
          </div>
        </Card>

        <Card>
          <Head title="Already sent" sub="Alerts sent through the app" />
          <div className="flex flex-col gap-2.5">
            {logErr && <p className="text-sm text-risk-high">{logErr}</p>}
            {!logErr && log === null && <p className="text-sm text-ink-soft">Loading…</p>}
            {log?.length === 0 && <p className="text-sm text-ink-soft">Nothing sent yet.</p>}
            {log?.map((a) => (
              <div key={a.id} className={`anim-rise flex gap-3 rounded-md border border-line px-3.5 py-3 text-sm ${a.active ? '' : 'opacity-60'}`}>
                <Pennant sev={FROM_API[a.severity]} size={26} />
                <div className="min-w-0 flex-1">
                  <b className="line-clamp-2">{a.body}</b>
                  <small className="block text-xs text-ink-soft">{a.title}</small>
                  <small className="block text-xs text-ink-soft">{a.createdBy.name} · {whenLabel(a.createdAt)}{a.active ? '' : ' · switched off'}</small>
                </div>
                {a.active && (
                  <button type="button" onClick={() => void switchOff(a.id)} className="h-fit shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-seafoam/50">Switch off</button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}