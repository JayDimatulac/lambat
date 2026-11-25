import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, Copy, KeyRound, Pause, Play, Plus, ShieldCheck, UserCog, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { useUser } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { Avatar, Badge, Empty, Modal, Panel, Stat, btnGhost, btnPrimary, inputCls } from './AdminBits'
import { ROLE_KEY, useA, type AKey } from './adminText'
import { MUNICIPALITIES, fmtMobile } from './adminStats'
import type { Ctx } from './data'

type U = {
  id: string
  name: string
  mobile: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'REJECTED'
  barangay: string
  createdAt: string
}
type Mode = { kind: 'new' } | { kind: 'reset'; user: U } | null

const COLS = 'lg:grid-cols-[minmax(0,2fr)_130px_110px_120px_minmax(0,1.3fr)]'
const err = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback)

export default function AdminAccounts() {
  const A = useA()
  const { lang } = useSettings()
  const me = useUser()
  const { toast } = useOutletContext<Ctx>()
  const [rows, setRows] = useState<U[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [mode, setMode] = useState<Mode>(null)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [area, setArea] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ mobile: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const loc = localeOf(lang)
  const day = (iso: string) => new Date(iso).toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' })

  const load = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.get<U[]>('/admin/users?role=ADMIN'), api.get<U[]>('/admin/users?role=SUPER_ADMIN')])
      setRows([...s, ...a])
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const close = () => { setMode(null); setName(''); setMobile(''); setArea(''); setPw(''); setMsg(''); setCreated(null); setCopied(false) }

  const create = async () => {
    const m = mobile.replace(/\s/g, '')
    if (name.trim().length < 2 || !/^09\d{9}$/.test(m) || pw.length < 8) { setMsg(A('ad.invalid')); return }
    setBusy(true); setMsg('')
    try {
      await api.post('/admin/users', { role: 'ADMIN', name: name.trim(), mobile: m, password: pw, barangay: area || undefined })
      setCreated({ mobile: m, password: pw })
      await load()
    } catch (e) { setMsg(err(e, A('c.error'))) } finally { setBusy(false) }
  }

  const copy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(`${created.mobile}\n${created.password}`)
      setCopied(true)
    } catch { /* clipboard blocked: the details are on screen */ }
  }

  const flip = async (u: U) => {
    try {
      await api.patch(`/admin/users/${u.id}/status`, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })
      toast(A('ad.updated')); await load()
    } catch (e) { toast(err(e, A('c.error'))) }
  }

  const reset = async (u: U) => {
    if (pw.length < 8) { setMsg(A('ad.invalid')); return }
    setBusy(true); setMsg('')
    try {
      await api.patch(`/admin/users/${u.id}/password`, { password: pw })
      toast(A('ad.reset.done')); close()
    } catch (e) { setMsg(err(e, A('c.error'))) } finally { setBusy(false) }
  }

  const admins = rows.filter((r) => r.role === 'ADMIN')
  const field = 'grid gap-1.5 text-sm font-semibold'
  const line = 'flex justify-between gap-4 px-4 py-3'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={UserCog} label={A('ad.active')} value={admins.filter((r) => r.status === 'ACTIVE').length} />
        <Stat icon={Pause} label={A('ad.paused')} value={admins.filter((r) => r.status === 'SUSPENDED').length} />
        <Stat icon={ShieldCheck} label={A('ad.supers')} value={rows.filter((r) => r.role === 'SUPER_ADMIN').length} />
      </div>

      <Panel
        flush
        icon={Users}
        title={A('nav.admins')}
        action={<button type="button" onClick={() => setMode({ kind: 'new' })} className={btnPrimary}><Plus size={18} strokeWidth={2.2} aria-hidden />{A('ad.add')}</button>}
      >
        {failed ? (
          <p className="p-6 text-risk-high">{A('c.error')}</p>
        ) : loading ? (
          <p className="p-6 text-ink-soft">{A('c.loading')}</p>
        ) : rows.length === 0 ? (
          <Empty icon={Users} text={A('ad.empty')} />
        ) : (
          <>
            <div role="row" className={`hidden items-center gap-4 border-y border-line bg-mint px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-soft lg:grid ${COLS}`}>
              <span>{A('ad.col.admin')}</span><span>{A('ad.col.role')}</span><span>{A('ad.col.status')}</span><span>{A('ad.col.added')}</span><span className="text-right">{A('ad.col.actions')}</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((u) => {
                const mine = u.id === me.id
                return (
                  <li key={u.id} className={`grid items-center gap-x-4 gap-y-3 px-5 py-4 ${COLS}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <b className="flex items-center gap-2 text-[15px] leading-tight"><span className="truncate">{u.name}</span>{mine && <Badge tone="slate">{A('ad.you')}</Badge>}</b>
                        <p className="truncate text-sm text-ink-soft">{fmtMobile(u.mobile)}{u.barangay && u.barangay !== 'N/A' ? ` · ${u.barangay}` : ''}</p>
                      </div>
                    </div>
                    <div><Badge tone={u.role === 'SUPER_ADMIN' ? 'teal' : 'slate'}>{A(ROLE_KEY[u.role])}</Badge></div>
                    <div><Badge tone={u.status === 'ACTIVE' ? 'green' : 'amber'}>{A((u.status === 'ACTIVE' ? 'ad.st.ACTIVE' : 'ad.st.SUSPENDED') as AKey)}</Badge></div>
                    <p className="text-sm text-ink-soft">{day(u.createdAt)}</p>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {u.role === 'ADMIN' && !mine && (
                        <>
                          <button type="button" onClick={() => flip(u)} className={`${btnGhost} !min-h-9 !px-3`}>
                            {u.status === 'ACTIVE' ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
                            {u.status === 'ACTIVE' ? A('ad.pause') : A('ad.activate')}
                          </button>
                          <button type="button" onClick={() => { setPw(''); setMsg(''); setMode({ kind: 'reset', user: u }) }} className={`${btnGhost} !min-h-9 !px-3`}>
                            <KeyRound size={16} aria-hidden />{A('ad.reset')}
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Panel>

      <Modal open={mode?.kind === 'new'} onClose={close} title={created ? A('ad.created') : A('ad.new.title')}>
        {created ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={name} />
              <div className="min-w-0"><b className="block truncate">{name}</b><p className="text-sm text-ink-soft">{A('ad.signin')}</p></div>
            </div>
            <dl className="divide-y divide-line overflow-hidden rounded-lg border border-line text-sm">
              <div className={line}><dt className="text-ink-soft">{A('ad.mobile')}</dt><dd className="font-semibold tabular-nums">{fmtMobile(created.mobile)}</dd></div>
              <div className={line}><dt className="text-ink-soft">{A('ad.password')}</dt><dd className="font-mono font-semibold">{created.password}</dd></div>
            </dl>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={copy} className={btnGhost}>{copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}{copied ? A('ad.copied') : A('ad.copy')}</button>
              <button type="button" onClick={close} className={btnPrimary}>{A('ad.done')}</button>
            </div>
          </>
        ) : (
          <>
            <label className={field}>{A('ad.name')}<input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="off" /></label>
            <label className={field}>{A('ad.mobile')}<input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" placeholder="09XX XXX XXXX" className={inputCls} autoComplete="off" /></label>
            <label className={field}>{A('ad.area')}
              <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
                <option value="">{A('ad.noarea')}</option>
                {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className={field}>{A('ad.password')}<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={A('ad.pwhint')} className={inputCls} autoComplete="new-password" /></label>
            {msg && <p role="alert" className="text-sm font-semibold text-risk-critical">{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={close} className={btnGhost}>{A('c.cancel')}</button>
              <button type="button" disabled={busy} onClick={create} className={btnPrimary}>{A('ad.create')}</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={mode?.kind === 'reset'} onClose={close} title={A('ad.reset.title')}>
        {mode?.kind === 'reset' && (
          <>
            <div className="flex items-center gap-3"><Avatar name={mode.user.name} /><b>{mode.user.name}</b></div>
            <label className={field}>{A('ad.newpw')}<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={A('ad.pwhint')} className={inputCls} autoComplete="new-password" /></label>
            {msg && <p role="alert" className="text-sm font-semibold text-risk-critical">{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={close} className={btnGhost}>{A('c.cancel')}</button>
              <button type="button" disabled={busy} onClick={() => reset(mode.user)} className={btnPrimary}>{A('ad.reset')}</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}