import { useEffect, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, Settings } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import LogoutSheet from '../../components/auth/LogoutSheet'
import LangToggle from '../../components/layout/LangToggle'
import Logo from '../../components/Logo'
import BuyerNotificationsMenu from '../../components/buyer/BuyerNotificationsMenu'
import { CrateIcon, RopeIcon, StallIcon } from '../../components/buyer/BuyerIcons'
import { KnotPlusIcon, PierIcon, TideIcon } from '../../components/icons'
import { useUser } from '../../lib/auth'
import { useBT, type BKey } from '../../lib/buyerText'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import emblem from '../../assets/lambat-emblem.png'
import { MoonTideIcon } from '../admin/AdminIcons'
import { Toggle } from '../admin/AdminBits'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label?: BKey; raw?: string; icon: Icon; end?: boolean }

const NEED = '/buyer/needs'
const DASH: Item = { to: '/buyer', label: 'nav.home', icon: LayoutDashboard, end: true }
const PIER: Item = { to: '/buyer/pier', label: 'nav.pantalan', icon: PierIcon }
const OFFERS: Item = { to: '/buyer/offers', label: 'nav.offers', icon: CrateIcon }
const NEEDS: Item = { to: NEED, label: 'nav.needs', icon: KnotPlusIcon }
const ORDERS: Item = { to: '/buyer/orders', label: 'nav.orders', icon: RopeIcon }
const STALL: Item = { to: '/buyer/stall', label: 'nav.stall', icon: StallIcon }
const ACCOUNT: Item = { to: '/buyer/settings', raw: 'Settings', icon: Settings }

// The dock lists every page. The phone bar shows Dashboard, Pier, the float, Orders and More. The rest are under More.
const NAV: Item[] = [DASH, PIER, OFFERS, NEEDS, ORDERS, STALL]
const PHONE_LEFT: Item[] = [DASH, PIER]
const PHONE_RIGHT: Item = ORDERS
const MORE: Item[] = [OFFERS, NEEDS, STALL, ACCOUNT]
const isActive = (i: Item, path: string) => (i.end ? path === i.to : path.startsWith(i.to))

/* The harbor dock, the same as the fisherfolk and admin one: a slim icon strip or open with labels. A button in the
   top bar toggles it, and the page content moves over to make room (nothing is covered). */
const rowBase = 'relative flex min-h-12 w-full items-center rounded-2xl text-left text-[15px] font-semibold leading-tight transition'
const rowIdle = 'text-navy/75 hover:bg-seafoam/70 hover:text-navy'
const rowOn = 'bg-seafoam text-teal'

function ActiveMark() {
  return <span aria-hidden="true" className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-coral" />
}

function FloatButton() {
  const b = useBT()
  return (
    <Link to={`${NEED}?new=1`} aria-label={b('needs.new')} className="relative grid size-14 place-items-center rounded-full bg-coral text-deep shadow-raised transition active:scale-95">
      <svg viewBox="0 0 72 72" className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)]" aria-hidden="true">
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-cream)" strokeWidth="4" strokeDasharray="7 4.4" strokeLinecap="round" />
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-coral)" strokeOpacity="0.5" strokeWidth="1.2" />
      </svg>
      <KnotPlusIcon size={26} />
    </Link>
  )
}

function Rail({ open, onLogout }: { open: boolean; onLogout: () => void }) {
  const t = useT()
  const b = useBT()
  const user = useUser()
  const { pathname } = useLocation()
  const name = (i: Item) => i.raw ?? b(i.label as BKey)
  const onAccount = pathname.startsWith(ACCOUNT.to)
  const rowPad = open ? 'gap-3 py-2 pl-4 pr-3' : 'justify-center'

  return (
    <div className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${open ? 'w-[264px]' : 'w-28'}`}>
      <aside
        id="app-rail"
        className={`fixed bottom-3 left-3 top-3 z-40 flex flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card to-ice px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] ${open ? 'w-60' : 'w-[88px]'}`}
      >
        <Link to="/buyer" aria-label="LAMBAT" className={`mb-4 flex shrink-0 items-center ${open ? 'px-1' : 'justify-center'}`}>
          <Logo size={48} emblemOnly={!open} />
        </Link>

        {/* The one primary action: a circle when the dock is slim, a pill when it is open */}
        <Link
          to={`${NEED}?new=1`}
          aria-label={b('needs.new')}
          title={open ? undefined : b('needs.new')}
          className={`flex h-12 shrink-0 items-center overflow-hidden rounded-full bg-coral font-bold text-deep shadow-raised transition hover:bg-peach active:scale-95 ${open ? 'w-full pl-2' : 'mx-auto w-12 justify-center'}`}
        >
          <span className="grid size-12 shrink-0 place-items-center"><Plus size={24} strokeWidth={2.6} aria-hidden="true" /></span>
          {open && <span className="whitespace-nowrap pr-5">{b('nav.need')}</span>}
        </Link>

        <div aria-hidden="true" className="my-4 h-px shrink-0 bg-line" />

        <nav className="flex flex-col gap-1.5" aria-label={t('nav.main')}>
          {NAV.map((item) => {
            const active = isActive(item, pathname)
            return (
              <NavLink key={item.to} to={item.to} end={item.end} aria-label={name(item)} title={open ? undefined : name(item)} className={`${rowBase} ${rowPad} ${active ? rowOn : rowIdle}`}>
                {active && <ActiveMark />}
                <item.icon size={24} strokeWidth={1.8} className="shrink-0" />
                {open && <span className="min-w-0">{name(item)}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* You: account and sign out, kept at the bottom of the dock */}
        <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
          <div aria-hidden="true" className="mb-2 h-px bg-line" />
          <NavLink
            to={ACCOUNT.to}
            aria-label={t('nav.settings')}
            title={open ? undefined : t('nav.settings')}
            className={`relative flex items-center rounded-2xl transition ${open ? 'gap-3 p-2' : 'flex-col gap-1 px-1 py-2'} ${onAccount ? rowOn : 'text-navy hover:bg-seafoam/70'}`}
          >
            {onAccount && <ActiveMark />}
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
            {open ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold">{user.shortName}</span>
                <span className="block truncate text-xs font-medium text-ink-soft">{t('nav.settings')}</span>
              </span>
            ) : (
              <span className="flex max-w-full items-center gap-0.5 text-[11px] font-semibold leading-none">
                <span className="truncate">{user.shortName}</span>
                <ChevronDown size={12} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              </span>
            )}
          </NavLink>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t('auth.logout')}
            className={`flex w-full items-center rounded-2xl font-semibold text-navy/75 transition hover:bg-risk-critical-bg hover:text-risk-critical ${open ? 'h-11 gap-3 pl-4 pr-3 text-[15px]' : 'flex-col justify-center gap-0.5 py-1.5 text-[10px] leading-tight'}`}
          >
            <LogOut size={open ? 22 : 18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate">{t('auth.logout')}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

const cell = 'relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold min-[390px]:text-[13px]'

function TabLook({ active, icon: Ico, label }: { active: boolean; icon: Icon; label: string }) {
  return (
    <>
      {/* knot on the net line; the active one is pulled up taut */}
      <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
      {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
      <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
        <Ico size={24} strokeWidth={1.8} />
      </span>
      <span className={`max-w-full truncate px-0.5 ${active ? 'text-teal' : 'text-navy'}`}>{label}</span>
    </>
  )
}

function ParolaToggle({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  const t = useT()
  const text = night ? t('adm.day') : t('adm.night')
  return (
    <button type="button" aria-pressed={night} aria-label={text} title={text} onClick={onToggle} className="grid size-11 place-items-center rounded-full border border-line transition hover:bg-seafoam/60">
      <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 25 L12.2 12 H15.8 L17 25 Z" />
        <path d="M11.7 18.5 H16.3" />
        <rect x="12" y="8" width="4" height="4" rx="0.8" fill={night ? 'var(--color-coral)' : 'none'} stroke={night ? 'var(--color-coral)' : 'currentColor'} />
        <path d="M11.5 8 L14 5 L16.5 8 Z" />
        <path d="M7.5 25 H20.5" />
        <g stroke="var(--color-coral)" className={night ? 'anim-glow' : ''} opacity={night ? 1 : 0.35}>
          <path d="M10 10 H4.5" />
          <path d="M10.5 7.2 L5.5 5" />
          <path d="M18 10 H23.5" />
          <path d="M17.5 7.2 L22.5 5" />
        </g>
      </svg>
    </button>
  )
}

export default function BuyerLayout() {
  const t = useT()
  const b = useBT()
  const user = useUser()
  const { theme, setTheme } = useSettings()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  // close the menu whenever the page changes
  useEffect(() => { setMenu(false) }, [pathname])
  // the sidebar is slim by default; the person's choice is remembered (shared with the other roles)
  const [railOpen, setRailOpen] = useState(() => {
    try { return localStorage.getItem('lambat.rail') === 'open' } catch { return false }
  })
  const toggleRail = () =>
    setRailOpen((open) => {
      const next = !open
      try { localStorage.setItem('lambat.rail', next ? 'open' : 'closed') } catch { /* storage can be blocked */ }
      return next
    })

  const name = (i: Item) => i.raw ?? b(i.label as BKey)
  const night = theme === 'night'
  const current = [...NAV, ACCOUNT].find((i) => isActive(i, pathname))
  const PageIcon = current?.icon
  const title = current ? (current === ACCOUNT ? t('nav.settings') : name(current)) : pathname.startsWith('/buyer/alerts') ? b('nav.alerts') : 'LAMBAT'
  const place = user.buyer?.businessName ?? t('byr.role')
  const moreActive = menu || MORE.some((i) => isActive(i, pathname))
  const tab = (item: Item) => (
    <NavLink key={item.to} to={item.to} end={item.end} className={cell}>
      <TabLook active={isActive(item, pathname)} icon={item.icon} label={name(item)} />
    </NavLink>
  )

  return (
    <div className="app-backdrop min-h-dvh overflow-x-clip lg:flex">
      <Rail open={railOpen} onLogout={() => setAskLogout(true)} />

      <div className="min-w-0 flex-1">
        {/* Top bar: a floating glass bar that lines up with the page content */}
        <header className="sticky top-0 z-30 pt-3">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <div className="relative flex h-16 items-center justify-between gap-2 rounded-3xl border border-line bg-card/80 pl-3 pr-2 shadow-rest backdrop-blur-md sm:gap-3 sm:pl-4">
              <Link to="/buyer" aria-label="LAMBAT" className="flex shrink-0 items-center gap-2 lg:hidden">
                <img src={emblem} alt="" width={40} height={40} draggable={false} className="size-10 shrink-0 rounded-full" />
                <span className="hidden font-display text-xl font-bold tracking-wide sm:inline">LAMBAT</span>
              </Link>
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 text-center font-display text-lg font-bold tracking-wide sm:hidden">LAMBAT</span>
              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  onClick={toggleRail}
                  aria-expanded={railOpen}
                  aria-controls="app-rail"
                  aria-label={t(railOpen ? 'nav.collapse' : 'nav.expand')}
                  title={t(railOpen ? 'nav.collapse' : 'nav.expand')}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-navy transition hover:bg-seafoam/60"
                >
                  {railOpen ? <PanelLeftClose size={20} strokeWidth={1.8} aria-hidden="true" /> : <PanelLeftOpen size={20} strokeWidth={1.8} aria-hidden="true" />}
                </button>
                <span aria-hidden="true" className="h-9 w-1 rounded-full bg-coral" />
                {PageIcon && <PageIcon size={26} strokeWidth={1.8} className="shrink-0 text-teal" />}
                <div className="leading-tight">
                  <p className="font-display text-xl font-bold">{title}</p>
                  <p className="text-sm font-medium text-ink-soft">{place}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ParolaToggle night={night} onToggle={() => setTheme(night ? 'day' : 'night')} />
                <div className="hidden sm:block"><LangToggle /></div>
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <BuyerNotificationsMenu />
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  aria-label={t('hdr.menu')}
                  className="hidden items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:flex lg:pr-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
                  <span className="hidden text-sm font-semibold lg:block">{user.shortName}</span>
                  <ChevronDown size={16} strokeWidth={2} aria-hidden className="hidden lg:block" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-10"><Outlet /></main>
      </div>

      {/* Phone bar: Dashboard, Pier, the float, Orders and More */}
      <nav aria-label={t('nav.main')} className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {PHONE_LEFT.map(tab)}
        <div className="relative flex min-h-16 items-start justify-center">
          <div className="-mt-6"><FloatButton /></div>
        </div>
        {tab(PHONE_RIGHT)}
        <button type="button" onClick={() => setMenu(true)} aria-haspopup="dialog" aria-expanded={menu} className={cell}>
          <TabLook active={moreActive} icon={MoreHorizontal} label={t('menu.more')} />
        </button>
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title={user.buyer?.businessName ?? t('byr.role')}>
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-soft">{t('byr.role')}</p>
          </div>
        </div>
        {MORE.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMenu(false)}
            className={({ isActive: on }) => `flex min-h-12 items-center gap-3 rounded-lg border px-4 font-semibold ${on ? 'border-teal bg-seafoam text-teal' : 'border-line'}`}
          >
            <item.icon size={20} strokeWidth={1.8} />{item === ACCOUNT ? t('nav.settings') : name(item)}
          </NavLink>
        ))}
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-mint px-4">
          <span className="text-teal">{night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />}</span>
          <span className="flex-1 font-semibold">{t('menu.night')}</span>
          <Toggle checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} label={t('menu.night')} />
        </div>
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-line bg-mint px-4 sm:hidden">
          <span className="font-semibold">{t('lang.title')}</span>
          <LangToggle />
        </div>
        <button type="button" onClick={() => { setMenu(false); setAskLogout(true) }}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} />
          {t('auth.logout')}
        </button>
      </Sheet>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />
    </div>
  )
}