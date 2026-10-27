import { useState } from 'react'
import { CheckCircle2, Clock, LogOut } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import LogoutSheet from '../components/auth/LogoutSheet'
import { useUser } from '../lib/auth'
import { useT, type Key } from '../lib/i18n'

// The buyer's side is not built yet. Until an admin approves them, a buyer only sees where their application stands.
export default function BuyerHome() {
  const t = useT()
  const user = useUser()
  const [askLogout, setAskLogout] = useState(false)
  const pending = user.status === 'PENDING'
  const b = user.buyer

  return (
    <AuthLayout>
      <div className="space-y-5">
        <span className={`grid size-20 place-items-center rounded-full ${pending ? 'bg-seafoam text-teal' : 'bg-risk-low-bg text-risk-low'}`}>
          {pending ? <Clock size={40} strokeWidth={1.8} aria-hidden /> : <CheckCircle2 size={40} strokeWidth={1.8} aria-hidden />}
        </span>
        <div>
          <h1 className="font-numeral text-[30px] font-bold leading-tight">{pending ? t('buyer.pending.title') : t('buyer.active.title')}</h1>
          <p className="mt-2 text-lg">{pending ? t('buyer.pending.text') : t('buyer.active.text')}</p>
        </div>
        <dl className="space-y-2 rounded-lg border border-line bg-mint p-4 text-base">
          <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.name')}</dt><dd className="font-semibold">{user.name}</dd></div>
          {b && <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.biz')}</dt><dd className="text-right font-semibold">{b.businessName}</dd></div>}
          {b && <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('reg.biztype')}</dt><dd className="text-right font-semibold">{t(`party.${b.buyerType}` as Key)}</dd></div>}
          <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t('buyer.status')}</dt><dd className="font-bold">{t(`status.${user.status}` as Key)}</dd></div>
        </dl>
        <button type="button" onClick={() => setAskLogout(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-lg font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} aria-hidden />
          {t('auth.logout')}
        </button>
      </div>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </AuthLayout>
  )
}