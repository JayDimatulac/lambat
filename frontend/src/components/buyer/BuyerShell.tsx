import type { ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BuoyIcon, KnotPlusIcon, PierIcon } from '../icons'
import { CrateIcon, HornIcon, RopeIcon, StallIcon } from './BuyerIcons'
import LangToggle from '../layout/LangToggle'
import { useUser } from '../../lib/auth'
import { useBuyerAlerts } from '../../lib/buyerAlerts'
import { useBT, type BKey } from '../../lib/buyerText'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: BKey; icon: Icon; end?: boolean }

const tabs: Item[] = [
  { to: '/buyer', label: 'nav.pantalan', icon: PierIcon, end: true },
  { to: '/buyer/offers', label: 'nav.offers', icon: CrateIcon },
  { to: '/buyer/orders', label: 'nav.orders', icon: RopeIcon },
  { to: '/buyer/stall', label: 'nav.stall', icon: StallIcon },
]
const NEED = '/buyer/needs'
const isActive = (item: Item, path: string) => (item.end ? path === item.to : path.startsWith(item.to))

/* The float: the one main action for a buyer is to say what they need. Same buoy as the fisher's log button. */
function FloatButton({ size }: { size: 'sm' | 'lg' }) {
  const b = useBT()
  const dim = size === 'lg' ? 'size-16' : 'size-14'
  return (
    <Link to={`${NEED}?new=1`} aria-label={b('needs.new')} className={`relative grid ${dim} place-items-center rounded-full bg-coral text-deep shadow-raised transition active:scale-95`}>
      <svg viewBox="0 0 72 72" className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)]" aria-hidden="true">
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-cream)" strokeWidth="4" strokeDasharray="7 4.4" strokeLinecap="round" />
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-coral)" strokeOpacity="0.5" strokeWidth="1.2" />
      </svg>
      <KnotPlusIcon size={size === 'lg' ? 30 : 26} />
    </Link>
  )
}

function Rail() {
  const b = useBT()
  const { pathname } = useLocation()
  const items: Item[] = [tabs[0], tabs[1], { to: NEED, label: 'nav.needs', icon: KnotPlusIcon }, tabs[2], tabs[3]]
  return (
    <aside className="net-mesh sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center overflow-y-auto border-r border-line bg-card py-4 lg:flex">
      <Link to="/buyer" className="mb-4 flex flex-col items-center gap-1 text-navy">
        <BuoyIcon size={30} className="text-teal" />
        <span className="font-display text-sm font-bold tracking-wider">LAMBAT</span>
      </Link>
      <div className="mb-3 flex flex-col items-center gap-1">
        <FloatButton size="sm" />
        <span className="text-[13px] font-semibold">{b('nav.need')}</span>
      </div>
      <nav className="flex flex-col items-center gap-1" aria-label="Main">
        {items.map((item) => {
          const active = isActive(item, pathname)
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={`flex min-h-14 w-20 flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[13px] font-semibold leading-tight transition ${active ? 'bg-seafoam text-teal' : 'text-navy hover:bg-seafoam/60'}`}>
              <item.icon size={24} strokeWidth={1.8} />
              {b(item.label)}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

function BottomBar() {
  const b = useBT()
  const { pathname } = useLocation()
  const tab = (item: Item) => {
    const active = isActive(item, pathname)
    return (
      <NavLink key={item.to} to={item.to} end={item.end} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold">
        <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
        {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
        <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}><item.icon size={24} strokeWidth={1.8} /></span>
        <span className={active ? 'text-teal' : 'text-navy'}>{b(item.label)}</span>
      </NavLink>
    )
  }
  return (
    <nav aria-label="Main" className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {tab(tabs[0])}
      {tab(tabs[1])}
      <div className="relative flex flex-col items-center justify-end pb-1.5">
        <div className="-mt-8"><FloatButton size="lg" /></div>
        <span className="mt-1 text-[13px] font-semibold">{b('nav.need')}</span>
      </div>
      {tab(tabs[2])}
      {tab(tabs[3])}
    </nav>
  )
}

export default function BuyerShell() {
  const user = useUser()
  const b = useBT()
  const { unread } = useBuyerAlerts()
  return (
    <div className="min-h-dvh lg:flex">
      <Rail />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line bg-card/90 px-4 backdrop-blur lg:px-8">
          <Link to="/buyer" className="flex items-center gap-2 lg:invisible">
            <BuoyIcon size={26} className="text-teal" />
            <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link to="/buyer/alerts" aria-label={b('nav.alerts')} className="relative grid size-12 place-items-center rounded-full hover:bg-seafoam">
              <HornIcon size={26} className="text-teal" />
              {unread > 0 && <em className="absolute -right-0.5 top-0.5 min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-bold not-italic text-deep">{unread}</em>}
            </Link>
            <Link to="/buyer/stall" aria-label={user.name} className="grid size-12 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10"><Outlet /></main>
      </div>
      <BottomBar />
    </div>
  )
}