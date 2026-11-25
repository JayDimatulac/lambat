import { useEffect, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, FileText, History, LayoutDashboard, LogOut, Megaphone, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Settings as Cog, ShieldCheck, TrendingUp, User, Users } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import LogoutSheet from '../../components/auth/LogoutSheet'
import LangToggle from '../../components/layout/LangToggle'
import Logo from '../../components/Logo'
import { TideIcon } from '../../components/icons'
import { useAuth, useUser } from '../../lib/auth'
import { useT } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import emblem from '../../assets/lambat-emblem.png'
import { MoonTideIcon } from './AdminIcons'
import { Toggle } from './AdminBits'
import { useA, type AKey } from './adminText'
import type { Ctx } from './data'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; k: AKey; icon: Icon; end?: boolean }

const ADMIN_NAV: Item[] = [
  { to: '/admin', k: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/verifications', k: 'nav.applications', icon: FileText },
  { to: '/admin/advisories', k: 'nav.advisories', icon: Megaphone },
  { to: '/admin/history', k: 'nav.history', icon: History },
]
const SUPER_NAV: Item[] = [
  { to: '/admin', k: 'nav.overview', icon: LayoutDashboard, end: true },
  { to: '/admin/verifications', k: 'nav.verification', icon: ShieldCheck },
  { to: '/admin/advisory-review', k: 'nav.advisoryReview', icon: Megaphone },
  { to: '/admin/admins', k: 'nav.admins', icon: Users },
  { to: '/admin/reports', k: 'nav.reports', icon: TrendingUp },
  { to: '/admin/activity', k: 'nav.activity', icon: History },
]
const ACCOUNT: Item = { to: '/admin/account', k: 'nav.account', icon: User }
const SETTINGS: Item = { to: '/admin/settings', k: 'nav.settings', icon: Cog }
// pages that exist but have no menu link
const EXTRA: [string, AKey][] = [
  ['/admin/listings', 'nav.catches'],
  ['/admin/reference', 'nav.shelf'],
]

const isActive = (item: Item, path: string) => (item.end ? path === item.to : path.startsWith(item.to))

/* The harbor dock: a solid floating panel that follows day and night. It is either a slim icon strip or open
   with labels. A button in the top bar toggles it, and the page content moves over to make room (nothing is covered). */
const rowBase = 'relative flex min-h-12 w-full items-center rounded-2xl text-left text-[15px] font-semibold leading-tight transition'
const rowIdle = 'text-navy/75 hover:bg-seafoam/70 hover:text-navy'
const rowOn = 'bg-seafoam text-teal'

/* a small coral tab on the edge marks the page you are on, like a lighthouse light */
function ActiveMark() {
  return <span aria-hidden="true" className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-coral" />
}

const Count = ({ n, className }: { n: number; className: string }) =>
  n > 0 ? <em className={`absolute min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-bold not-italic text-deep ${className}`}>{n}</em> : null

function Rail({ open, nav, pending, isSuper, onLogout }: { open: boolean; nav: Item[]; pending: number; isSuper: boolean; onLogout: () => void }) {
  const t = useT()
  const A = useA()
  const user = useUser()
  const { pathname } = useLocation()
  const onAccount = pathname.startsWith(ACCOUNT.to)
  const rowPad = open ? 'gap-3 py-2 pl-4 pr-3' : 'justify-center'

  const row = (item: Item) => {
    const active = isActive(item, pathname)
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        aria-label={A(item.k)}
        title={open ? undefined : A(item.k)}
        className={`${rowBase} ${rowPad} ${active ? rowOn : rowIdle}`}
      >
        {active && <ActiveMark />}
        <span className="relative shrink-0">
          <item.icon size={24} strokeWidth={1.8} />
          {item.to.endsWith('verifications') && <Count n={pending} className="-right-2 -top-2" />}
        </span>
        {open && <span className="min-w-0">{A(item.k)}</span>}
      </NavLink>
    )
  }

  return (
    <div className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${open ? 'w-[264px]' : 'w-28'}`}>
      <aside
        id="app-rail"
        className={`fixed bottom-3 left-3 top-3 z-40 flex flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card to-ice px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] ${open ? 'w-60' : 'w-[88px]'}`}
      >
        {/* Brand: the full logo when open, just the emblem when slim */}
        <Link to="/admin" aria-label="LAMBAT" className={`mb-4 flex shrink-0 items-center ${open ? 'px-1' : 'justify-center'}`}>
          <Logo size={48} emblemOnly={!open} />
        </Link>

        <div aria-hidden="true" className="mb-4 h-px shrink-0 bg-line" />

        <nav className="flex flex-col gap-1.5" aria-label={A(isSuper ? 'role.super' : 'role.admin')}>
          {nav.map(row)}
        </nav>

        {/* You: settings, profile and sign out, kept at the bottom of the dock */}
        <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
          <div aria-hidden="true" className="mb-2 h-px bg-line" />
          {isSuper && row(SETTINGS)}
          <NavLink
            to={ACCOUNT.to}
            aria-label={A(ACCOUNT.k)}
            title={open ? undefined : A(ACCOUNT.k)}
            className={`relative flex items-center rounded-2xl transition ${open ? 'gap-3 p-2' : 'flex-col gap-1 px-1 py-2'} ${onAccount ? rowOn : 'text-navy hover:bg-seafoam/70'}`}
          >
            {onAccount && <ActiveMark />}
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
            {open ? (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold">{user.shortName}</span>
                <span className="block truncate text-xs font-medium text-ink-soft">{A(ACCOUNT.k)}</span>
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

function TabLook({ active, icon: Icon, label, badge }: { active: boolean; icon: Icon; label: string; badge?: number }) {
  return (
    <>
      {/* knot on the net line; the active one is pulled up taut */}
      <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
      {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
      <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
        <Icon size={24} strokeWidth={1.8} />
        {!!badge && <Count n={badge} className="-right-1 -top-1" />}
      </span>
      <span className={`max-w-full truncate px-0.5 ${active ? 'text-teal' : 'text-navy'}`}>{label}</span>
    </>
  )
}

/* The parola: one tap switches between day and night at sea. Its lamp is lit at night. */
function ParolaToggle() {
  const t = useT()
  const { theme, setTheme } = useSettings()
  const night = theme === 'night'
  return (
    <button
      type="button"
      aria-pressed={night}
      aria-label={t('menu.night')}
      title={t('menu.night')}
      onClick={() => setTheme(night ? 'day' : 'night')}
      className="grid size-11 place-items-center rounded-full border border-line transition hover:bg-seafoam/60"
    >
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

export default function AdminLayout() {
  const t = useT()
  const A = useA()
  const user = useUser()
  const { accounts } = useAuth()
  const { theme, setTheme } = useSettings()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const [msg, setMsg] = useState('')
  // close the menu whenever the page changes
  useEffect(() => { setMenu(false) }, [pathname])
  // the sidebar is slim by default; the person's choice is remembered
  const [railOpen, setRailOpen] = useState(() => {
    try { return localStorage.getItem('lambat.rail') === 'open' } catch { return false }
  })
  const toggleRail = () =>
    setRailOpen((open) => {
      const next = !open
      try { localStorage.setItem('lambat.rail', next ? 'open' : 'closed') } catch { /* storage can be blocked */ }
      return next
    })

  const isSuper = user.role === 'super_admin'
  const nav = isSuper ? SUPER_NAV : ADMIN_NAV
  const roleName = A(isSuper ? 'role.super' : 'role.admin')
  const phone = nav.slice(0, 4)
  const more = [...nav.slice(4), ACCOUNT, ...(isSuper ? [SETTINGS] : [])]

  // real accounts waiting for approval (buyers sign up on their own; organizations are made by an admin)
  const pending = accounts.filter((a) => a.role !== 'admin' && a.role !== 'super_admin' && a.status === 'PENDING').length
  const night = theme === 'night'
  const current = [...nav, ACCOUNT, ...(isSuper ? [SETTINGS] : [])].find((i) => isActive(i, pathname))
  const extra = EXTRA.find(([p]) => pathname.startsWith(p))
  const pageName = current ? A(current.k) : extra ? A(extra[1]) : roleName
  const PageIcon = current?.icon
  const moreActive = menu || more.some((i) => isActive(i, pathname))
  const toast = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 2400) }
  const ctx: Ctx = { toast }

  return (
    <div className="app-backdrop min-h-dvh overflow-x-clip lg:flex">
      <Rail open={railOpen} nav={nav} pending={pending} isSuper={isSuper} onLogout={() => setAskLogout(true)} />

      <div className="min-w-0 flex-1">
        {/* Top bar: a floating glass bar that lines up with the page content */}
        <header className="sticky top-0 z-30 pt-3">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <div className="relative flex h-16 items-center justify-between gap-2 rounded-3xl border border-line bg-card/80 pl-3 pr-2 shadow-rest backdrop-blur-md sm:gap-3 sm:pl-4">
              {/* Phones and tablets: the logo. Desktop: where you are. */}
              <Link to="/admin" aria-label="LAMBAT" className="flex shrink-0 items-center gap-2 lg:hidden">
                <img src={emblem} alt="" width={40} height={40} draggable={false} className="size-10 shrink-0 rounded-full" />
                <span className="hidden font-display text-xl font-bold tracking-wide sm:inline">LAMBAT</span>
              </Link>
              {/* phones: the name sits in the middle of the bar */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 text-center font-display text-lg font-bold tracking-wide sm:hidden">
                LAMBAT
              </span>
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
                  <p className="font-display text-xl font-bold">{pageName}</p>
                  <p className="text-sm font-medium text-ink-soft">{roleName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {!isSuper && (
                  <Link
                    to="/admin/verifications"
                    aria-label={pending > 0 ? A('ly.waiting', { n: pending }) : A('nav.applications')}
                    className="relative grid size-11 place-items-center rounded-full border border-line transition hover:bg-seafoam/60"
                  >
                    <Bell size={20} strokeWidth={1.8} />
                    {pending > 0 && <span aria-hidden="true" className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-coral" />}
                  </Link>
                )}
                <ParolaToggle />
                <div className="hidden sm:block"><LangToggle /></div>
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  aria-label={t('hdr.menu')}
                  className="hidden items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:flex lg:pr-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
                  <span className="hidden text-sm font-semibold lg:block">{roleName}</span>
                  <ChevronDown size={16} strokeWidth={2} aria-hidden className="hidden lg:block" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-10">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* Phone bar: four pages and More, the rest are under More */}
      <nav aria-label={roleName} className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {phone.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={cell}>
            <TabLook active={isActive(item, pathname)} icon={item.icon} label={A(item.k)} badge={item.to.endsWith('verifications') ? pending : undefined} />
          </NavLink>
        ))}
        <button type="button" onClick={() => setMenu(true)} aria-haspopup="dialog" aria-expanded={menu} className={cell}>
          <TabLook active={moreActive} icon={MoreHorizontal} label={A('nav.more')} />
        </button>
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title={roleName}>
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-soft">{roleName}</p>
          </div>
        </div>
        {more.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMenu(false)}
            className={({ isActive: on }) => `flex min-h-12 items-center gap-3 rounded-lg border px-4 font-semibold ${on ? 'border-teal bg-seafoam text-teal' : 'border-line'}`}
          >
            <item.icon size={20} strokeWidth={1.8} />{A(item.k)}
          </NavLink>
        ))}
        <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-mint px-4">
          <span className="text-teal">{night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />}</span>
          <span className="flex-1 font-semibold">{t('menu.night')}</span>
          <Toggle checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} label={t('menu.night')} />
        </div>
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-line bg-mint px-4 sm:hidden">
          <span className="font-semibold">{A('st.language')}</span>
          <LangToggle />
        </div>
        <button
          type="button"
          onClick={() => { setMenu(false); setAskLogout(true) }}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal"
        >
          <LogOut size={22} strokeWidth={1.8} />{t('auth.logout')}
        </button>
      </Sheet>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />

      <div role="status" className={`fixed bottom-24 right-4 z-40 rounded-md bg-deep px-4 py-3 font-semibold text-white shadow-raised transition lg:bottom-6 lg:right-6 ${msg ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}>{msg}</div>
    </div>
  )
}