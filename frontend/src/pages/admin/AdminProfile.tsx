import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { KeyRound, UserRound } from 'lucide-react'
import { api, setToken } from '../../lib/api'
import { useUser } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { Avatar, Badge, Panel, btnPrimary, inputCls } from './AdminBits'
import { ROLE_KEY, useA } from './adminText'
import { fmtMobile } from './adminStats'
import type { Ctx } from './data'

// The route that changes the signed-in user's password (app.ts rate-limits /api/auth/change-password)
const CHANGE_PASSWORD_PATH = '/auth/change-password'

export default function AdminProfile() {
  const A = useA()
  const { lang } = useSettings()
  const user = useUser()
  const { toast } = useOutletContext<Ctx>()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [again, setAgain] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const since = new Date(user.createdAt).toLocaleDateString(localeOf(lang), { month: 'long', year: 'numeric' })

  const submit = async () => {
    if (pw.length < 8) { setMsg(A('ma.short')); return }
    if (pw !== again) { setMsg(A('ma.mismatch')); return }
    setBusy(true); setMsg('')
    try {
      const r = await api.post<{ token: string }>(CHANGE_PASSWORD_PATH, { currentPassword: cur, newPassword: pw })
      setToken(r.token)
      toast(A('ma.changed')); setCur(''); setPw(''); setAgain('')
    } catch (e) {
      setMsg(e instanceof Error && e.message ? e.message : A('c.error'))
    } finally {
      setBusy(false)
    }
  }

  const rows: [string, string][] = [
    [A('ma.mobile'), user.mobile ? fmtMobile(user.mobile) : '—'],
    [A('ma.area'), user.barangay && user.barangay !== 'N/A' ? user.barangay : '—'],
    [A('ma.since'), since],
  ]
  const field = 'grid gap-1.5 text-sm font-semibold'

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
      <Panel icon={UserRound} title={A('ma.profile')}>
        <div className="flex flex-col items-center gap-3 pb-5 text-center">
          <Avatar name={user.name} size={80} />
          <div>
            <p className="font-display text-xl font-bold leading-tight">{user.name}</p>
            <div className="mt-2"><Badge tone="teal">{A(ROLE_KEY[user.role] ?? 'role.admin')}</Badge></div>
          </div>
        </div>
        <dl className="divide-y divide-line border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel icon={KeyRound} title={A('ma.password')}>
        <div className="grid max-w-md gap-4">
          <label className={field}>{A('ma.current')}<input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} autoComplete="current-password" /></label>
          <label className={field}>{A('ma.new')}<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} autoComplete="new-password" /></label>
          <label className={field}>{A('ma.confirm')}<input type="password" value={again} onChange={(e) => setAgain(e.target.value)} className={inputCls} autoComplete="new-password" /></label>
          {msg && <p role="alert" className="text-sm font-semibold text-risk-critical">{msg}</p>}
          <div><button type="button" disabled={busy || !cur || !pw} onClick={submit} className={btnPrimary}>{A('ma.change')}</button></div>
        </div>
      </Panel>
    </div>
  )
}