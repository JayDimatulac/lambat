import { useState } from 'react'
import { ChevronRight, LogOut, Mail, MapPin, Phone, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import LogoutSheet from '../../components/auth/LogoutSheet'
import { LifebuoyIcon, StallIcon } from '../../components/buyer/BuyerIcons'
import { useUser } from '../../lib/auth'
import { useMarket } from '../../lib/market'
import { useT, type Key } from '../../lib/i18n'
import { useBT } from '../../lib/buyerText'

export default function BuyerStall() {
  const b = useBT()
  const t = useT()
  const user = useUser()
  const m = useMarket()
  const [askLogout, setAskLogout] = useState(false)
  const done = m.orders.filter((o) => o.buyerId === user.id && o.status === 'received')
  const rescued = done.filter((o) => o.rescue)
  const kg = (xs: typeof done) => xs.reduce((n, o) => n + o.kg, 0)
  const isRescue = rescued.length >= 3
  const prof = user.buyer

  const stats: [number, string][] = [
    [done.length, b('stall.stats.orders')],
    [kg(done), b('stall.stats.kg')],
    [kg(rescued), b('stall.stats.rescued')],
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-lg shadow-raised" style={{ background: 'linear-gradient(135deg, var(--tide-sky-1), var(--tide-sea-1))' }}>
        <div className="flex items-center gap-3 p-4 text-white sm:gap-4 sm:p-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-white/70 font-numeral text-xl font-bold sm:size-16 sm:text-2xl">{user.initials}</span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-numeral text-xl font-bold leading-tight sm:text-2xl">{user.name}</h1>
            <p className="truncate text-sm text-white/90">{prof ? `${prof.businessName} · ${t(`party.${prof.buyerType}` as Key)}` : t('byr.role')}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-risk-low px-2.5 py-0.5 text-xs font-bold text-white">{t('status.ACTIVE')}</p>
          </div>
          <StallIcon size={56} className="hidden shrink-0 text-white/80 sm:block" />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-line bg-card/90 p-4 shadow-rest">
        <h2 className="font-numeral text-lg font-bold">{b('stall.info')}</h2>
        <ul className="space-y-2 text-sm">
          {user.mobile && <li className="flex items-center gap-2"><Phone size={16} className="shrink-0 text-teal" aria-hidden="true" />{user.mobile}</li>}
          {user.email && <li className="flex items-center gap-2"><Mail size={16} className="shrink-0 text-teal" aria-hidden="true" /><span className="min-w-0 break-all">{user.email}</span></li>}
          <li className="flex items-center gap-2"><MapPin size={16} className="shrink-0 text-teal" aria-hidden="true" /><span className="min-w-0">{prof?.address || user.barangay}</span></li>
        </ul>
      </section>

      <section className={`rounded-lg border-2 p-4 ${isRescue ? 'border-coral bg-card shadow-raised' : 'border-line bg-card'}`}>
        <div className="flex items-center gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-full sm:size-14 ${isRescue ? 'bg-coral text-deep' : 'bg-mint text-teal'}`}><LifebuoyIcon size={28} /></span>
          <div className="min-w-0">
            <h2 className="font-numeral text-lg font-bold leading-tight sm:text-xl">{isRescue ? b('stall.rescue.got') : b('stall.rescue')}</h2>
            <p className="text-sm text-ink-soft">{b('stall.rescue.sub')}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5" role="img" aria-label={b('stall.rescue.n', { n: Math.min(3, rescued.length) })}>
          {[0, 1, 2].map((i) => <i key={i} className={`h-3 flex-1 rounded-full ${i < rescued.length ? 'bg-coral' : 'bg-line'}`} />)}
        </div>
        <p className="mt-1 text-xs font-semibold text-ink-soft">{b('stall.rescue.n', { n: Math.min(3, rescued.length) })}</p>
      </section>

      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        {stats.map(([n, label]) => (
          <div key={label} className="flex min-w-0 flex-col justify-between rounded-lg border border-line bg-card p-2.5 sm:p-3">
            <p className="font-numeral text-2xl font-bold text-teal sm:text-3xl">{n}</p>
            <p className="text-xs font-semibold leading-tight text-ink-soft">{label}</p>
          </div>
        ))}
      </div>

      <Link to="/buyer/settings" className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-card px-4 font-semibold transition hover:bg-seafoam/50">
        <Settings size={22} strokeWidth={1.8} className="text-teal" aria-hidden="true" />
        <span className="flex-1">{b('stall.settings')}</span>
        <ChevronRight size={18} className="text-ink-soft" aria-hidden="true" />
      </Link>

      <button type="button" onClick={() => setAskLogout(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
        <LogOut size={22} strokeWidth={1.8} aria-hidden />{t('auth.logout')}
      </button>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}