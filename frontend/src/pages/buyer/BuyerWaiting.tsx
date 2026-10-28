import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import LogoutSheet from '../../components/auth/LogoutSheet'
import { ChoiceTile, TextField } from '../../components/auth/Fields'
import AnchorScene from '../../components/buyer/AnchorScene'
import { useAuth, useUser } from '../../lib/auth'
import type { BuyerType } from '../../lib/accounts'
import { useT, type Key } from '../../lib/i18n'
import { useBT } from '../../lib/buyerText'

const TYPES: BuyerType[] = ['market', 'trader', 'restaurant', 'smokehouse']

// The only page a buyer sees until an admin approves them. When the admin approves, this page opens the pier by itself.
export default function BuyerWaiting() {
  const t = useT()
  const b = useBT()
  const user = useUser()
  const { resubmit } = useAuth()
  const [askLogout, setAskLogout] = useState(false)
  const prof = user.buyer
  const [biz, setBiz] = useState(prof?.businessName ?? '')
  const [type, setType] = useState<BuyerType>(prof?.buyerType ?? 'market')
  const [address, setAddress] = useState(prof?.address ?? '')
  const [err, setErr] = useState(false)

  if (user.status === 'ACTIVE') return <Navigate to="/buyer" replace />
  const rejected = user.status === 'REJECTED'
  const stepAt = 1 // sent is done, being checked is now

  return (
    <AuthLayout>
      <div className="space-y-5">
        <AnchorScene tone={rejected ? 'no' : 'wait'} />
        <div>
          <h1 className="font-numeral text-[28px] font-bold leading-tight">{rejected ? b('wait.no.title') : b('wait.title')}</h1>
          {!rejected && <p className="mt-2 text-lg">{b('wait.text')}</p>}
        </div>

        {rejected ? (
          <>
            <div className="rounded-lg border-2 border-risk-critical-line bg-risk-critical-bg p-4">
              <p className="text-sm font-bold text-risk-critical">{b('wait.no.why')}</p>
              <p className="mt-1 text-base font-semibold text-risk-critical">{user.note || '—'}</p>
            </div>
            <p className="text-base">{b('wait.no.fix')}</p>
            <TextField label={t('reg.biz')} value={biz} onChange={(e) => setBiz(e.target.value)} />
            <div className="space-y-2" role="radiogroup" aria-label={t('reg.biztype')}>
              {TYPES.map((x) => <ChoiceTile key={x} selected={type === x} onClick={() => setType(x)} title={t(`party.${x}` as Key)} />)}
            </div>
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} error={err ? b('wait.no.fill') : null} />
            <button type="button" onClick={() => { if (!biz.trim() || !address.trim()) return setErr(true); resubmit({ businessName: biz.trim(), buyerType: type, address: address.trim() }) }}
              className="flex min-h-14 w-full items-center justify-center rounded-full bg-coral text-lg font-semibold text-deep shadow-raised transition active:scale-[0.98]">
              {b('wait.no.send')}
            </button>
          </>
        ) : (
          <>
            {/* the tide line: sent, being checked, approved */}
            <ol className="flex items-start justify-between">
              {(['wait.s1', 'wait.s2', 'wait.s3'] as const).map((k, i) => (
                <li key={k} className="relative flex flex-1 flex-col items-center gap-1 text-center">
                  {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[15px] h-0.5 w-full ${i <= stepAt ? 'bg-teal' : 'bg-line'}`} />}
                  <span className={`relative z-10 grid size-8 place-items-center rounded-full border-2 ${i <= stepAt ? 'border-teal bg-teal text-on-accent' : 'border-line bg-card'} ${i === stepAt ? 'anim-pop ring-4 ring-seafoam' : ''}`}>
                    {i < stepAt ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.6L10 17.4L19 7" /></svg> : i === stepAt ? <i className="anim-glow size-2.5 rounded-full bg-on-accent" /> : null}
                  </span>
                  <span className={`text-xs font-semibold ${i <= stepAt ? 'text-navy' : 'text-ink-soft'}`}>{b(k)}</span>
                </li>
              ))}
            </ol>
            <dl className="space-y-2 rounded-lg border border-line bg-mint p-4 text-base">
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.name')}</dt><dd className="font-semibold">{user.name}</dd></div>
              {prof && <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.biz')}</dt><dd className="text-right font-semibold">{prof.businessName}</dd></div>}
              {prof && <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.biztype')}</dt><dd className="text-right font-semibold">{t(`party.${prof.buyerType}` as Key)}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('buyer.status')}</dt><dd className="font-bold">{t('status.PENDING')}</dd></div>
            </dl>
          </>
        )}

        <button type="button" onClick={() => setAskLogout(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-lg font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} aria-hidden />
          {t('auth.logout')}
        </button>
      </div>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </AuthLayout>
  )
}