import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Check, ChevronDown, CloudSun, LogOut, Send, Sparkles, UserRound, Wifi, WifiLow, WifiOff } from 'lucide-react'
import { FishIcon, KnotPlusIcon, PierIcon, TideIcon } from '../icons'
import { useT, type Key } from '../../lib/i18n'
import { useSettings, type Connection } from '../../lib/settings'
import { useUser } from '../../lib/auth'
import LangToggle from './LangToggle'
import MenuSheet from './MenuSheet'
import NotificationsMenu from './NotificationsMenu'
import LogoutSheet from '../auth/LogoutSheet'
import Logo from '../Logo'


type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: Key; icon: Icon; end?: boolean }

const tabs: Item[] = [
  { to: '/home', label: 'nav.home', icon: TideIcon, end: true },
  { to: '/catches', label: 'nav.catches', icon: FishIcon },
  { to: '/weather', label: 'nav.weather', icon: CloudSun },
  { to: '/buyers', label: 'nav.buyers', icon: PierIcon },
]
const railItems: Item[] = [...tabs, { to: '/value-added', label: 'nav.value', icon: Sparkles }]

/* What the top bar calls the current page */
const pageTitles: { to: string; label: Key }[] = [
  ...railItems.map((i) => ({ to: i.to, label: i.label })),
  { to: '/notifications', label: 'nav.alerts' },
  { to: '/profile', label: 'nav.profile' },
  { to: '/settings', label: 'nav.settings' },
]

const isActive = (item: Item, path: string) => (item.end ? path === item.to : path.startsWith(item.to))

/* The float: a round buoy with a rope ring. Logging a catch is the one primary action. */
function FloatButton({ size }: { size: 'sm' | 'lg' }) {
  const t = useT()
  const dim = size === 'lg' ? 'size-16' : 'size-14'
  return (
    <Link to="/catches/new" aria-label={t('page.log')} className={`relative grid ${dim} place-items-center rounded-full bg-coral text-deep shadow-raised transition active:scale-95`}>
      <svg viewBox="0 0 72 72" className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)]" aria-hidden="true">
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-cream)" strokeWidth="4" strokeDasharray="7 4.4" strokeLinecap="round" />
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-coral)" strokeOpacity="0.5" strokeWidth="1.2" />
      </svg>
      <KnotPlusIcon size={size === 'lg' ? 30 : 26} />
    </Link>
  )
}

/* The harbor dock: a floating panel that follows day and night (it uses the theme colors). It rests as a slim
   icon strip and opens by itself when the pointer (or keyboard focus) reaches it. It opens OVER the page. */
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
  const t = useT()
  const { pathname } = useLocation()
  const [askLogout, setAskLogout] = useState(false)
  const onProfile = pathname.startsWith('/profile')
  return (
    <div className="hidden w-24 shrink-0 lg:block">
      <aside
        className="group/dock fixed bottom-3 left-3 top-3 z-40 flex w-[72px] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card via-card to-seafoam/70 px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] hover:w-48 has-[:focus-visible]:w-48"
      >
        {/* Brand: the emblem in a coral ring, like the circle in the logo */}
        <Link to="/home" aria-label="LAMBAT" className="mb-5 flex h-12 shrink-0 items-center gap-3">
          <Logo size={48} className="size-12" />
          <span className={`font-display text-lg font-bold tracking-wider text-navy ${label}`}>LAMBAT</span>
        </Link>

        {/* The one primary action */}
        <Link
          to="/catches/new"
          aria-label={t('page.log')}
          className="flex h-12 w-full shrink-0 items-center overflow-hidden rounded-full bg-coral font-bold text-deep shadow-raised transition hover:bg-peach active:scale-95"
        >
          <span className="grid size-12 shrink-0 place-items-center">
            <KnotPlusIcon size={24} />
          </span>
          <span className={`pr-5 ${label}`}>{t('page.log')}</span>
        </Link>

        <div aria-hidden="true" className="my-4 h-px shrink-0 bg-line" />

        <nav className="flex flex-col gap-1.5" aria-label={t('nav.main')}>
          {railItems.map((item) => {
            const active = isActive(item, pathname)
            return (
              <NavLink key={item.to} to={item.to} end={item.end} aria-label={t(item.label)} className={`${rowBase} ${active ? rowOn : rowIdle}`}>
                {active && <ActiveGlow />}
                <item.icon size={24} strokeWidth={1.8} className="relative shrink-0" />
                <span className={`relative ${label}`}>{t(item.label)}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* You: profile and sign out, kept at the bottom of the dock */}
        <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
          <div aria-hidden="true" className="mb-2 h-px bg-line" />
          <NavLink to="/profile" aria-label={t('nav.profile')} className={`${rowBase} ${onProfile ? rowOn : rowIdle}`}>
            {onProfile && <ActiveGlow />}
            <UserRound size={24} strokeWidth={1.8} className="relative shrink-0" />
            <span className={`relative ${label}`}>{t('nav.profile')}</span>
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
  const t = useT()
  const { pathname } = useLocation()
  const tab = (item: Item) => {
    const active = isActive(item, pathname)
    return (
      <NavLink key={item.to} to={item.to} end={item.end} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold">
        {/* knot on the net line; the active one is pulled up taut */}
        <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
        {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
        <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
          <item.icon size={24} strokeWidth={1.8} />
        </span>
        <span className={active ? 'text-teal' : 'text-navy'}>{t(item.label)}</span>
      </NavLink>
    )
  }
  return (
    <nav aria-label="Main" className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {tab(tabs[0])}
      {tab(tabs[1])}
      <div className="relative flex flex-col items-center justify-end pb-1.5">
        <div className="-mt-8"><FloatButton size="lg" /></div>
        <span className="mt-1 text-[13px] font-semibold">{t('nav.log')}</span>
      </div>
      {tab(tabs[2])}
      {tab(tabs[3])}
    </nav>
  )
}

/* Demo connection state, as a dropdown in the top bar */
function ConnectionMenu() {
  const t = useT()
  const { connection, setConnection } = useSettings()
  const [open, setOpen] = useState(false)
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

  const options: { value: Connection; icon: typeof Wifi; text: string; cls: string }[] = [
    { value: 'online', icon: Wifi, text: t('conn.online'), cls: 'text-risk-low' },
    { value: 'weak', icon: WifiLow, text: t('conn.weak'), cls: 'text-risk-moderate' },
    { value: 'offline', icon: WifiOff, text: t('conn.offline'), cls: 'text-risk-high' },
  ]
  const cur = options.find((o) => o.value === connection) ?? options[0]

  return (
    <div ref={box} className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('conn.demo')}
        onClick={() => setOpen(!open)}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold transition hover:bg-seafoam/60 ${cur.cls}`}
      >
        <cur.icon size={18} strokeWidth={1.8} aria-hidden />
        <span className="hidden xl:inline">{cur.text}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={t('conn.demo')} className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-line bg-card p-1.5 shadow-raised">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{t('conn.demo')}</p>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === connection}
              onClick={() => { setConnection(o.value); setOpen(false) }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-seafoam"
            >
              <o.icon size={18} strokeWidth={1.8} aria-hidden className={o.cls} />
              {o.text}
              {o.value === connection && <Check size={16} strokeWidth={2.2} aria-hidden className="ml-auto text-teal" />}
            </button>
          ))}
        </div>
      )}
    </div>
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
      className="hidden size-11 place-items-center rounded-full border border-line transition hover:bg-seafoam/60 sm:grid"
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

/* Shows only when the signal is weak or gone. The SMS button is a UI demo: nothing is sent yet.
   It sits inside the same margins as the top bar and the page. */
function ConnectionBar() {
  const t = useT()
  const { connection } = useSettings()
  const [queued, setQueued] = useState(false)
  if (connection === 'online') return null
  const weak = connection === 'weak'
  return (
    <div className="mx-auto max-w-5xl px-4 pt-3 lg:px-8">
      <div role="status" className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${weak ? 'border-risk-moderate-line bg-risk-moderate-bg text-risk-moderate' : 'border-risk-high-line bg-risk-high-bg text-risk-high'}`}>
        <p className="flex items-center gap-2 font-semibold">
          {weak ? <WifiLow size={20} strokeWidth={1.8} aria-hidden /> : <WifiOff size={20} strokeWidth={1.8} aria-hidden />}
          {weak ? t('conn.weak.msg') : t('conn.offline.msg')}
        </p>
        <button
          type="button"
          disabled={queued}
          onClick={() => setQueued(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current bg-card px-4 text-sm font-semibold"
        >
          {queued ? <Check size={18} strokeWidth={1.8} aria-hidden /> : <Send size={18} strokeWidth={1.8} aria-hidden />}
          {queued ? t('conn.sms.done') : t('conn.sms')}
        </button>
      </div>
    </div>
  )
}

export default function AppShell() {
  const t = useT()
  const user = useUser()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const current = pageTitles.find((p) => pathname.startsWith(p.to))
  const place = user.fisher?.landing || user.barangay
  return (
    <div className="min-h-dvh lg:flex">
      <Rail />
      <div className="min-w-0 flex-1">
        {/* Top bar: a floating glass bar that lines up with the page content */}
        <header className="sticky top-0 z-30 pt-3">
          <div className="mx-auto max-w-5xl px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3 rounded-3xl border border-line bg-card/80 pl-4 pr-2 shadow-rest backdrop-blur-md">
              {/* Phones and tablets: the logo. Desktop: where you are. */}
              <Link to="/home" aria-label="LAMBAT" className="flex items-center gap-2.5 lg:hidden">
                <Logo size={40} className="size-10" />
                <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
              </Link>
              <div className="hidden items-center gap-3 lg:flex">
                <span aria-hidden="true" className="h-9 w-1 rounded-full bg-coral" />
                <div className="leading-tight">
                  <p className="font-display text-xl font-bold">{current ? t(current.label) : 'LAMBAT'}</p>
                  {place && <p className="text-sm font-medium text-ink-soft">{place}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ConnectionMenu />
                <ParolaToggle />
                <LangToggle />
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <NotificationsMenu />
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label={t('hdr.menu')}
                  className="flex items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:pr-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
                  <span className="hidden text-sm font-semibold lg:block">{user.shortName}</span>
                  <ChevronDown size={16} strokeWidth={2} aria-hidden className="hidden lg:block" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <ConnectionBar />
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomBar />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}