import { useState } from 'react'
import { LogOut, Moon, RotateCcw } from 'lucide-react'
import LogoutSheet from '../../components/auth/LogoutSheet'
import LangToggle from '../../components/layout/LangToggle'
import { LifebuoyIcon, StallIcon } from '../../components/buyer/BuyerIcons'
import { useUser } from '../../lib/auth'
import { useMarket } from '../../lib/market'
import { useSettings } from '../../lib/settings'
import { useT, type Key } from '../../lib/i18n'
import { useBT } from '../../lib/buyerText'

export default function BuyerStall() {
  const b = useBT()
  const t = useT()
  const user = useUser()
  const m = useMarket()
  const { theme, setTheme } = useSettings()
  const [askLogout, setAskLogout] = useState(false)
  const done = m.orders.filter((o) => o.buyerId === user.id && o.status === 'received')
  const rescued = done.filter((o) => o.rescue)
  const kg = (xs: typeof done) => xs.reduce((n, o) => n + o.kg, 0)
  const isRescue = rescued.length >= 3
  const prof = user.buyer

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <section className="overflow-hidden rounded-lg border border-line bg-card shadow-rest">
        <div className="h-4" style={{ background: 'repeating-linear-gradient(90deg, var(--color-coral) 0 18px, var(--color-cream) 18px 36px)' }} aria-hidden="true" />
        <div className="flex items-center gap-4 p-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><StallIcon size={34} /></span>
          <div className="min-w-0">
            <h1 className="font-numeral text-2xl font-bold leading-tight">{prof?.businessName ?? user.name}</h1>
            <p className="text-sm text-ink-soft">{prof ? `${t(`party.${prof.buyerType}` as Key)} · ${prof.address}` : user.barangay}</p>
            <p className="mt-1 inline-flex rounded-full bg-risk-low-bg px-2.5 py-0.5 text-xs font-bold text-risk-low">{t('status.ACTIVE')}</p>
          </div>
        </div>
      </section>

      <section className={`rounded-lg border-2 p-4 ${isRescue ? 'border-coral bg-card shadow-raised' : 'border-line bg-card'}`}>
        <div className="flex items-center gap-3">
          <span className={`grid size-14 shrink-0 place-items-center rounded-full ${isRescue ? 'bg-coral text-deep' : 'bg-mint text-teal'}`}><LifebuoyIcon size={32} /></span>
          <div>
            <h2 className="font-numeral text-xl font-bold">{isRescue ? b('stall.rescue.got') : b('stall.rescue')}</h2>
            <p className="text-sm text-ink-soft">{b('stall.rescue.sub')}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5" role="img" aria-label={b('stall.rescue.n', { n: Math.min(3, rescued.length) })}>
          {[0, 1, 2].map((i) => <i key={i} className={`h-3 flex-1 rounded-full ${i < rescued.length ? 'bg-coral' : 'bg-line'}`} />)}
        </div>
        <p className="mt-1 text-xs font-semibold text-ink-soft">{b('stall.rescue.n', { n: Math.min(3, rescued.length) })}</p>
      </section>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[[done.length, b('stall.stats.orders')], [kg(done), b('stall.stats.kg')], [kg(rescued), b('stall.stats.rescued')]].map(([n, label]) => (
          <div key={label as string} className="rounded-lg border border-line bg-card p-3"><p className="font-numeral text-3xl font-extrabold text-teal">{n}</p><p className="text-xs font-semibold text-ink-soft">{label}</p></div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-line bg-card p-4">
        <div className="flex items-center justify-between gap-3"><p className="font-semibold">{t('menu.language')}</p><LangToggle /></div>
        <button type="button" role="switch" aria-checked={theme === 'night'} onClick={() => setTheme(theme === 'night' ? 'day' : 'night')} className="flex min-h-12 w-full items-center gap-3 text-left">
          <Moon size={22} strokeWidth={1.8} className="text-teal" aria-hidden />
          <span className="flex-1 font-semibold">{b('stall.night')}</span>
          <span aria-hidden="true" className={`relative h-8 w-14 rounded-full transition ${theme === 'night' ? 'bg-teal' : 'bg-line'}`}><span className={`absolute top-1 size-6 rounded-full bg-card shadow-rest transition-all ${theme === 'night' ? 'left-7' : 'left-1'}`} /></span>
        </button>
        <button type="button" onClick={m.resetMarket} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-line text-sm font-semibold text-ink-soft"><RotateCcw size={18} strokeWidth={1.8} aria-hidden />{b('stall.reset')}</button>
      </div>

      <button type="button" onClick={() => setAskLogout(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
        <LogOut size={22} strokeWidth={1.8} aria-hidden />{t('auth.logout')}
      </button>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}