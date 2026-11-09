import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { KnotPlusIcon, PierIcon } from '../icons'
import Logo from '../Logo'
import { CrateIcon, RopeIcon, StallIcon } from './BuyerIcons'
import BuyerNotificationsMenu from '../../components/buyer/BuyerNotificationsMenu'
import LangToggle from '../layout/LangToggle'
import ParolaToggle from '../layout/ParolaToggle'
import LogoutSheet from '../auth/LogoutSheet'
import { useUser } from '../../lib/auth'
import { useBT, type BKey } from '../../lib/buyerText'
import { useT } from '../../lib/i18n'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: BKey; icon: Icon; end?: boolean }

const tabs: Item[] = [
  { to: '/buyer', label: 'nav.pantalan', icon: PierIcon, end: true },
  { to: '/buyer/offers', label: 'nav.offers', icon: CrateIcon },
  { to: '/buyer/orders', label: 'nav.orders', icon: RopeIcon },
  { to: '/buyer/stall', label: 'nav.stall', icon: StallIcon },
]
const NEED = '/buyer/needs'
const railItems: Item[] = [tabs[0], tabs[1], { to: NEED, label: 'nav.needs', icon: KnotPlusIcon }, tabs[2]]
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

/* The harbor dock: the same floating panel as the fisher's. It rests as a slim icon strip and opens
   by itself when the pointer (or keyboard focus) reaches it. It opens OVER the page. */
const label = 'min-w-0 whitespace-nowrap leading-tight opacity-0 transition-opacity duration-200 group-hover/dock:whitespace-normal group-hover/dock:opacity-100 group-has-[:focus-visible]/dock:whitespace-normal group-has-[:focus-visible]/dock:opacity-100'
const rowBase = 'relative flex h-12 w-full items-center gap-3 rounded-2xl pl-3 pr-4 text-left text-[15px] font-semibold transition'
const rowIdle = 'text-navy/75 hover:bg-seafoam/70 hover:text-navy'
const rowOn = 'bg-seafoam text-teal'

/* the lighthouse beam: a coral light reaching in from the edge, marking the page you are on */
function ActiveGlow() {
  return (
    <>
      <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-gradient-to-r from-coral/30 via-coral/10 to-transparent" />
      <span aria-hidden="true" className="absolute -left-3 top-3 h-6 w-1 rounded-r-full bg-coral" />
    </>
  )
}

function Rail() {
  const b = useBT()
  const t = useT()
  const { pathname } = useLocation()
  const [askLogout, setAskLogout] = useState(false)
  const onStall = pathname.startsWith('/buyer/stall')
  const onSettings = pathname.startsWith('/buyer/settings')
  return (
    <div className="hidden w-24 shrink-0 lg:block">
      <aside
        className="group/dock fixed bottom-3 left-3 top-3 z-40 flex w-[72px] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card via-card to-seafoam/70 px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] hover:w-48 has-[:focus-visible]:w-48"
      >
        <Link to="/buyer" aria-label="LAMBAT" className="mb-5 flex h-12 shrink-0 items-center gap-3">
          <Logo size={48} className="bg-deep ring-2 ring-coral/80 ring-offset-2 ring-offset-card" />
          <span className={`font-display text-lg font-bold tracking-wider text-navy ${label}`}>LAMBAT</span>
        </Link>

        {/* The one primary action */}
        <Link
          to={`${NEED}?new=1`}
          aria-label={b('needs.new')}
          className="flex h-12 shrink-0 items-center gap-3 rounded-full bg-coral pl-3 pr-5 font-bold text-deep shadow-raised transition hover:bg-peach active:scale-95"
        >
          <KnotPlusIcon size={24} className="shrink-0" />
          <span className={label}>{b('nav.need')}</span>
        </Link>

        <div aria-hidden="true" className="my-4 h-px shrink-0 bg-line" />

        <nav className="flex flex-col gap-1.5" aria-label="Main">
          {railItems.map((item) => {
            const active = isActive(item, pathname)
            return (
              <NavLink key={item.to} to={item.to} end={item.end} aria-label={b(item.label)} className={`${rowBase} ${active ? rowOn : rowIdle}`}>
                {active && <ActiveGlow />}
                <item.icon size={24} strokeWidth={1.8} className="relative shrink-0" />
                <span className={`relative ${label}`}>{b(item.label)}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* You: stall, settings and sign out, kept at the bottom of the dock */}
        <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
          <div aria-hidden="true" className="mb-2 h-px bg-line" />
          <NavLink to="/buyer/stall" aria-label={b('nav.stall')} className={`${rowBase} ${onStall ? rowOn : rowIdle}`}>
            {onStall && <ActiveGlow />}
            <StallIcon size={24} strokeWidth={1.8} className="relative shrink-0" />
            <span className={`relative ${label}`}>{b('nav.stall')}</span>
          </NavLink>
          <NavLink to="/buyer/settings" aria-label={t('nav.settings')} className={`${rowBase} ${onSettings ? rowOn : rowIdle}`}>
            {onSettings && <ActiveGlow />}
            <Settings size={24} strokeWidth={1.8} className="relative shrink-0" />
            <span className={`relative ${label}`}>{t('nav.settings')}</span>
          </NavLink>
          <button type="button" onClick={() => setAskLogout(true)} aria-label={t('auth.logout')} className={`${rowBase} text-navy/75 hover:bg-risk-critical-bg hover:text-risk-critical`}>
            <LogOut size={24} strokeWidth={1.8} className="shrink-0" />
            <span className={label}>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
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

/* The avatar in the top bar opens a small menu: your stall, settings, and sign out. */
function UserMenu() {
  const b = useBT()
  const t = useT()
  const user = useUser()
  const [open, setOpen] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const row = 'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-seafoam'
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:pr-3"
      >
        <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
        <span className="hidden text-sm font-semibold lg:block">{user.shortName}</span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden className={`hidden transition lg:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-line bg-card p-1.5 shadow-raised">
          <div className="px-3 pb-2 pt-2.5">
            <p className="font-semibold leading-tight">{user.buyer?.businessName ?? user.name}</p>
            <p className="text-sm text-ink-soft">{user.buyer?.address ?? user.barangay}</p>
          </div>
          <div aria-hidden="true" className="mx-2 mb-1 h-px bg-line" />
          <Link role="menuitem" to="/buyer/stall" onClick={() => setOpen(false)} className={row}>
            <StallIcon size={20} strokeWidth={1.8} className="text-teal" />
            {b('nav.stall')}
          </Link>
          <Link role="menuitem" to="/buyer/settings" onClick={() => setOpen(false)} className={row}>
            <Settings size={20} strokeWidth={1.8} aria-hidden className="text-teal" />
            {t('nav.settings')}
          </Link>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setAskLogout(true) }} className={`${row} hover:!bg-risk-critical-bg hover:text-risk-critical`}>
            <LogOut size={20} strokeWidth={1.8} aria-hidden />
            {t('auth.logout')}
          </button>
        </div>
      )}
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}

export default function BuyerShell() {
  const user = useUser()
  const b = useBT()
  const t = useT()
  const { pathname } = useLocation()

  // What the top bar calls the current page
  const title =
    pathname.startsWith('/buyer/offers') ? b('nav.offers')
    : pathname.startsWith('/buyer/needs') ? b('nav.needs')
    : pathname.startsWith('/buyer/orders') ? b('nav.orders')
    : pathname.startsWith('/buyer/stall') ? b('nav.stall')
    : pathname.startsWith('/buyer/alerts') ? b('nav.alerts')
    : pathname.startsWith('/buyer/settings') ? t('nav.settings')
    : b('nav.pantalan')
  const place = user.buyer?.businessName ?? user.barangay

  return (
    <div className="min-h-dvh lg:flex">
      <Rail />
      <div className="min-w-0 flex-1">
        {/* Top bar: a floating glass bar that lines up with the page content */}
        <header className="sticky top-0 z-30 pt-3">
          <div className="mx-auto max-w-5xl px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3 rounded-3xl border border-line bg-card/80 pl-4 pr-2 shadow-rest backdrop-blur-md">
              {/* Phones and tablets: the logo. Desktop: where you are. */}
              <Link to="/buyer" aria-label="LAMBAT" className="flex items-center gap-2.5 lg:hidden">
                <Logo size={40} className="bg-deep ring-2 ring-coral/70" />
                <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
              </Link>
              <div className="hidden items-center gap-3 lg:flex">
                <span aria-hidden="true" className="h-9 w-1 rounded-full bg-coral" />
                <div className="leading-tight">
                  <p className="font-display text-xl font-bold">{title}</p>
                  {place && <p className="text-sm font-medium text-ink-soft">{place}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ParolaToggle />
                <LangToggle />
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <BuyerNotificationsMenu />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10"><Outlet /></main>
      </div>
      <BottomBar />
    </div>
  )
}