import { useState } from 'react'
import { Check, LogOut, ShieldCheck, Undo2, X } from 'lucide-react'
import LogoutSheet from '../../components/auth/LogoutSheet'
import { useAuth, useUser } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useT, type Key } from '../../lib/i18n'
import { localeOf } from '../../lib/time'
import type { Account } from '../../lib/accounts'

// Admins decide which buyers may contact fisherfolk. Admin and organization accounts are only ever made by an admin.
function BuyerCard({ a, children }: { a: Account; children: React.ReactNode }) {
  const t = useT()
  const { lang } = useSettings()
  return (
    <li className="space-y-3 rounded-lg border border-line bg-card p-4 shadow-rest">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-numeral text-xl font-bold leading-tight">{a.buyer?.businessName}</p>
          <p className="text-sm text-ink-soft">{a.buyer && t(`party.${a.buyer.buyerType}` as Key)}</p>
        </div>
        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold">{t(`status.${a.status}` as Key)}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-soft">{t('reg.name')}</dt><dd className="font-semibold">{a.name}</dd>
        <dt className="text-ink-soft">{t('reg.mobile')}</dt><dd className="font-semibold">{a.mobile}</dd>
        <dt className="text-ink-soft">{t('reg.barangay')}</dt><dd className="font-semibold">{a.barangay}</dd>
        {a.buyer?.address && (<><dt className="text-ink-soft">{t('reg.address')}</dt><dd className="font-semibold">{a.buyer.address}</dd></>)}
        <dt className="text-ink-soft">{t('admin.applied')}</dt><dd className="font-semibold">{new Date(a.createdAt).toLocaleDateString(localeOf(lang), { month: 'short', day: 'numeric' })}</dd>
      </dl>
      {children}
    </li>
  )
}

export default function Admin() {
  const t = useT()
  const user = useUser()
  const { accounts, setStatus } = useAuth()
  const [askLogout, setAskLogout] = useState(false)
  const buyers = accounts.filter((a) => a.role === 'buyer')
  const pending = buyers.filter((a) => a.status === 'PENDING')
  const decided = buyers.filter((a) => a.status !== 'PENDING')

  return (
    <div className="mx-auto min-h-dvh max-w-3xl space-y-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal text-on-accent"><ShieldCheck size={24} strokeWidth={1.8} aria-hidden /></span>
          <div>
            <h1 className="font-numeral text-2xl font-bold leading-tight">{t('admin.title')}</h1>
            <p className="text-sm text-ink-soft">{user.name}</p>
          </div>
        </div>
        <button type="button" onClick={() => setAskLogout(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">
          <LogOut size={20} strokeWidth={1.8} aria-hidden />{t('auth.logout')}
        </button>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl">{t('admin.pending')} ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-card p-6 text-center text-ink-soft">{t('admin.none')}</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((a) => (
              <BuyerCard key={a.id} a={a}>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setStatus(a.id, 'ACTIVE')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-teal font-semibold text-on-accent"><Check size={20} strokeWidth={2.4} aria-hidden />{t('admin.approve')}</button>
                  <button type="button" onClick={() => setStatus(a.id, 'REJECTED')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-risk-critical-line font-semibold text-risk-critical"><X size={20} strokeWidth={2.4} aria-hidden />{t('admin.reject')}</button>
                </div>
              </BuyerCard>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl">{t('admin.decided')}</h2>
          <ul className="space-y-3">
            {decided.map((a) => (
              <BuyerCard key={a.id} a={a}>
                <button type="button" onClick={() => setStatus(a.id, 'PENDING')} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal"><Undo2 size={18} strokeWidth={1.8} aria-hidden />{t('admin.undo')}</button>
              </BuyerCard>
            ))}
          </ul>
        </section>
      )}

      <p className="rounded-md border border-dashed border-teal/50 bg-seafoam/50 p-3 text-sm">{t('admin.note')}</p>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}