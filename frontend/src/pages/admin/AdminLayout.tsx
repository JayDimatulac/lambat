import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, Fish, Bell, Database, Anchor, Wifi, WifiOff } from 'lucide-react'
import { ACCOUNTS, type Account, type Ctx, type Status } from './data'

const NAV = [
  ['/admin', 'Home', LayoutDashboard], ['/admin/verifications', 'Verifications', ShieldCheck],
  ['/admin/listings', 'Mga Listing', Fish], ['/admin/advisories', 'Advisories', Bell], ['/admin/reference', 'Reference', Database],
] as const

export default function AdminLayout() {
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS)
  const [msg, setMsg] = useState('')
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  const pending = accounts.filter(a => a.status === 'pend').length
  const toast = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2400) }
  const setStatus = (i: number, s: Status) => setAccounts(a => a.map((x, j) => (j === i ? { ...x, status: s } : x)))
  const ctx: Ctx = { accounts, setStatus, toast }

  return (
    <div className="min-h-screen bg-mint font-sans text-navy md:grid md:grid-cols-[144px_1fr]">
      <aside className="net-mesh z-10 flex flex-col items-center gap-1 border-line bg-card px-2 py-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:flex-row max-md:border-t md:sticky md:top-0 md:h-screen md:border-r">
        <div className="mb-4 flex flex-col items-center gap-1 max-md:hidden">
          <Anchor size={34} />
          <b className="font-display text-lg tracking-widest">LAMBAT</b>
          <small className="text-[11px] text-teal">Admin</small>
        </div>
        <nav className="flex w-full gap-1 max-md:justify-around md:flex-col">
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              className={({ isActive }) => `relative flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-center text-[13px] font-medium leading-tight transition-colors max-md:gap-0.5 max-md:py-1.5 max-md:text-[11px] ${isActive ? 'bg-seafoam text-teal' : 'text-navy/80 hover:bg-seafoam/60'}`}>
              <Icon size={24} /><span>{label}</span>
              {to.endsWith('verifications') && pending > 0 && <em className="absolute right-3 top-1.5 min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-bold not-italic text-deep max-md:right-0 max-md:top-0">{pending}</em>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-end gap-3 border-b border-line px-4 py-3 md:px-10">
          <span className={`inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm font-semibold ${online ? 'text-risk-low' : 'text-risk-critical'}`}>
            {online ? <Wifi size={18} /> : <WifiOff size={18} />}{online ? 'Online' : 'Offline'}
          </span>
          <Link to="/admin/verifications" aria-label="Verifications" className="relative p-2">
            <Bell size={24} />{pending > 0 && <i className="absolute right-1.5 top-1.5 size-3 rounded-full bg-coral" />}
          </Link>
          <div className="grid size-11 place-items-center rounded-full bg-teal text-base font-bold text-on-accent">AD</div>
        </header>
        <main className="p-4 pb-24 md:px-10 md:pb-12 md:pt-8"><Outlet context={ctx} /></main>
      </div>
      <div role="status" className={`fixed bottom-6 right-6 z-20 rounded-md bg-deep px-4 py-3 font-semibold text-white shadow-raised transition ${msg ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}>{msg}</div>
    </div>
  )
}