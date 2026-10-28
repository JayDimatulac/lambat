import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Sheet from '../../components/ui/Sheet'
import LogoutSheet from '../../components/auth/LogoutSheet'
import { TideIcon } from '../../components/icons'
import { useAuth, useUser } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { BudyongIcon, HourglassTideIcon, LowerFlagIcon, MoonTideIcon, MooringIcon, SignalMastIcon, StringerIcon } from './AdminIcons'
import type { Ctx } from './data'
import type { Icon } from './ui'

type Item = { to: string; label: string; icon: Icon; end?: boolean }
const NAV: Item[] = [
  { to: '/admin', label: 'Overview', icon: SignalMastIcon, end: true },
  { to: '/admin/verifications', label: 'Verify', icon: MooringIcon },
  { to: '/admin/listings', label: 'Catches', icon: StringerIcon },
  { to: '/admin/advisories', label: 'Advisories', icon: BudyongIcon },
  { to: '/admin/reference', label: 'Shelf life', icon: HourglassTideIcon },
]
const isActive = (i: Item, path: string) => (i.end ? path === i.to : path.startsWith(i.to))

// A strand between two knots on the rail: slack normally, pulled straight next to the active item
function Strand({ taut }: { taut: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true" className="shrink-0">
      <path d={taut ? 'M7 0V18' : 'M7 0Q1 9 7 18'} stroke={taut ? 'var(--color-teal)' : 'var(--color-line)'} strokeWidth={taut ? 2.2 : 1.8} strokeLinecap="round" style={{ transition: 'd 0.3s' }} />
    </svg>
  )
}

const Count = ({ n, className }: { n: number; className: string }) =>
  n > 0 ? <em className={`absolute min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-bold not-italic text-deep ${className}`}>{n}</em> : null

function SwitchRow({ label, hint, checked, onChange, icon }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-md border border-line bg-mint px-4 py-3 text-left">
      <span className="text-teal">{icon}</span>
      <span className="flex-1"><span className="block font-semibold">{label}</span><span className="block text-sm text-ink-soft">{hint}</span></span>
      <span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-teal' : 'bg-line'}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-card shadow-rest transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  )
}

export default function AdminLayout() {
  const user = useUser()
  const { accounts } = useAuth()
  const { theme, setTheme } = useSettings()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const [msg, setMsg] = useState('')

  const pending = accounts.filter((a) => a.role !== 'admin' && a.status === 'PENDING').length
  const night = theme === 'night'
  const activeIdx = NAV.findIndex((i) => isActive(i, pathname))
  const toast = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(''), 2400) }
  const ctx: Ctx = { toast }

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop rail: the net strand with a knot per place */}
      <aside className="net-mesh sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center overflow-y-auto border-r border-line bg-card py-4 lg:flex">
        <Link to="/admin" className="mb-4 flex flex-col items-center gap-1 text-navy">
          <SignalMastIcon size={30} className="text-teal" />
          <span className="font-display text-sm font-bold tracking-wider">LAMBAT</span>
          <span className="rounded-full bg-seafoam px-2 text-[11px] font-bold tracking-widest text-teal">ADMIN</span>
        </Link>
        <nav className="flex flex-col items-center" aria-label="Admin">
          {NAV.map((item, i) => {
            const active = i === activeIdx
            return (
              <div key={item.to} className="flex flex-col items-center">
                <Strand taut={active || i - 1 === activeIdx} />
                <NavLink to={item.to} end={item.end}
                  className={`relative flex min-h-14 w-20 flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[13px] font-semibold leading-tight transition ${active ? 'bg-seafoam text-teal' : 'text-navy hover:bg-seafoam/60'}`}>
                  <item.icon size={24} />
                  {item.label}
                  {item.to.endsWith('verifications') && <Count n={pending} className="right-0 top-0" />}
                </NavLink>
              </div>
            )
          })}
        </nav>
        <button type="button" onClick={() => setAskLogout(true)}
          className="mt-auto flex min-h-14 w-20 flex-col items-center gap-1 rounded-md px-1 py-2 text-[13px] font-semibold text-navy hover:bg-seafoam/60">
          <LowerFlagIcon size={24} />
          Sign out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line bg-card/90 px-4 backdrop-blur lg:px-8">
          <Link to="/admin" className="flex items-center gap-2 lg:invisible">
            <SignalMastIcon size={26} className="text-teal" />
            <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
          </Link>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <Link to="/admin/verifications" className="hidden min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-teal sm:inline-flex">
                <MooringIcon size={18} />{pending} waiting
              </Link>
            )}
            <button type="button" onClick={() => setTheme(night ? 'day' : 'night')} aria-label={night ? 'Switch to day' : 'Switch to night'}
              className="grid size-12 place-items-center rounded-full hover:bg-seafoam">
              {night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />}
            </button>
            <button type="button" onClick={() => setMenu(true)} aria-label="Account menu"
              className="grid size-12 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">
              {user.initials}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10"><Outlet context={ctx} /></main>
      </div>

      {/* Phone bar */}
      <nav aria-label="Admin" className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map((item, i) => {
          const active = i === activeIdx
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold">
              <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
              {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
              <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
                <item.icon size={24} />
                {item.to.endsWith('verifications') && <Count n={pending} className="-right-1 -top-1" />}
              </span>
              <span className={active ? 'text-teal' : 'text-navy'}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Harbor admin">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-soft">Harbor admin</p>
          </div>
        </div>
        <SwitchRow icon={night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />} label="Night at sea" hint="Darker colors for the evening" checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} />
        <button type="button" onClick={() => { setMenu(false); setAskLogout(true) }}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
          <LowerFlagIcon size={22} />
          Sign out
        </button>
      </Sheet>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />

      <div role="status" className={`fixed bottom-24 right-4 z-40 rounded-md bg-deep px-4 py-3 font-semibold text-white shadow-raised transition lg:bottom-6 lg:right-6 ${msg ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}>{msg}</div>
    </div>
  )
}