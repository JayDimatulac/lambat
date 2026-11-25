import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CheckCircle2, Info, Megaphone, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Badge, Empty, Modal, Panel, Seg, btnDanger, type LIcon } from './AdminBits'
import { api } from '../../lib/api'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { useA, type AKey } from './adminText'
import type { Ctx } from './data'

type Adv = {
  id: string
  title: string
  body: string
  severity: 'INFO' | 'WARNING' | 'DANGER'
  audience: string | null
  active: boolean
  expiresAt: string | null
  createdAt: string
}
type Tab = 'awaiting' | 'published' | 'ended'

const SEV: Record<Adv['severity'], { icon: LIcon; tone: 'teal' | 'amber' | 'red' }> = {
  INFO: { icon: Info, tone: 'teal' },
  WARNING: { icon: TriangleAlert, tone: 'amber' },
  DANGER: { icon: ShieldAlert, tone: 'red' },
}
const ICON_TINT = {
  teal: 'bg-seafoam text-teal',
  amber: 'bg-risk-moderate-bg text-risk-moderate',
  red: 'bg-risk-critical-bg text-risk-critical',
} as const
const COLS = 'lg:grid-cols-[minmax(0,2fr)_140px_120px_120px_70px]'
const audKey = (v: string | null): AKey =>
  v === 'FISHERFOLK' ? 'ar.aud.fisher' : v === 'BUYER' ? 'ar.aud.buyer' : v === 'ORGANIZATION' ? 'ar.aud.org' : 'ar.aud.all'

export default function AdvisoryReview() {
  const A = useA()
  const { lang } = useSettings()
  const { toast } = useOutletContext<Ctx>()
  const [rows, setRows] = useState<Adv[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState<Tab>('published')
  const [open, setOpen] = useState<Adv | null>(null)
  const [busy, setBusy] = useState(false)

  const loc = localeOf(lang)
  const day = (iso: string) => new Date(iso).toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    let on = true
    api.get<Adv[]>('/advisories/all').then((r) => { if (on) setRows(r) }).catch(() => { if (on) setFailed(true) })
    return () => { on = false }
  }, [])

  const { live, ended } = useMemo(() => {
    const now = Date.now()
    const isLive = (r: Adv) => r.active && (!r.expiresAt || new Date(r.expiresAt).getTime() > now)
    const all = rows ?? []
    return { live: all.filter(isLive), ended: all.filter((r) => !isLive(r)) }
  }, [rows])

  const list = tab === 'published' ? live : tab === 'ended' ? ended : []
  const openIsLive = open ? live.some((r) => r.id === open.id) : false

  const end = async (r: Adv) => {
    setBusy(true)
    try {
      await api.patch(`/advisories/${r.id}/deactivate`, {})
      setRows((p) => (p ? p.map((x) => (x.id === r.id ? { ...x, active: false } : x)) : p))
      toast(A('ar.ended.done'))
      setOpen(null)
    } catch {
      toast(A('c.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Seg<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { k: 'awaiting', label: A('ar.awaiting'), n: 0 },
          { k: 'published', label: A('ar.published'), n: live.length },
          { k: 'ended', label: A('ar.ended'), n: ended.length },
        ]}
      />

      <Panel flush>
        {failed ? (
          <p className="p-6 text-risk-high">{A('c.error')}</p>
        ) : rows === null ? (
          <p className="p-6 text-ink-soft">{A('c.loading')}</p>
        ) : list.length === 0 ? (
          <Empty icon={tab === 'awaiting' ? CheckCircle2 : Megaphone} text={A(`ar.empty.${tab}` as AKey)} />
        ) : (
          <>
            <div role="row" className={`hidden items-center gap-4 border-b border-line bg-mint px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-soft lg:grid ${COLS}`}>
              <span>{A('ar.col.advisory')}</span><span>{A('ar.col.audience')}</span><span>{A('ar.col.posted')}</span><span>{A('ar.col.expires')}</span><span />
            </div>
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const s = SEV[r.severity] ?? SEV.INFO
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setOpen(r)} className={`grid w-full items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition hover:bg-seafoam/30 ${COLS}`}>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${ICON_TINT[s.tone]}`}><s.icon size={22} strokeWidth={1.8} /></span>
                        <span className="min-w-0">
                          <b className="block truncate text-[15px] leading-tight">{r.title}</b>
                          <span className="block truncate text-sm text-ink-soft">{r.body}</span>
                        </span>
                      </span>
                      <span className="hidden lg:block"><Badge tone="slate">{A(audKey(r.audience))}</Badge></span>
                      <span className="hidden text-sm lg:block">{day(r.createdAt)}</span>
                      <span className="hidden text-sm text-ink-soft lg:block">{r.expiresAt ? day(r.expiresAt) : A('ar.noexp')}</span>
                      <span className="hidden text-sm font-bold text-teal lg:block">{A('ar.view')}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-ink-soft lg:hidden">
                        <Badge tone="slate">{A(audKey(r.audience))}</Badge>
                        <span>{day(r.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Panel>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SEV[open.severity]?.tone ?? 'teal'}>{A(`ar.sev.${open.severity}` as AKey)}</Badge>
              <Badge tone="slate">{A(audKey(open.audience))}</Badge>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{open.body}</p>
            <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line text-sm">
              <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-soft">{A('ar.col.posted')}</dt><dd className="font-semibold">{day(open.createdAt)}</dd></div>
              <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-soft">{A('ar.col.expires')}</dt><dd className="font-semibold">{open.expiresAt ? day(open.expiresAt) : A('ar.noexp')}</dd></div>
            </dl>
            {openIsLive && (
              <button type="button" disabled={busy} onClick={() => end(open)} className={`${btnDanger} w-full`}>{A('ar.end')}</button>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}