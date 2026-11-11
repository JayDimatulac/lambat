import { useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
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
import { MoonTideIcon } from '../admin/AdminIcons'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: BKey; icon: Icon; end?: boolean }

const NEED = '/buyer/needs'
const PIER: Item = { to: '/buyer', label: 'nav.pantalan', icon: PierIcon, end: true }
const OFFERS: Item = { to: '/buyer/offers', label: 'nav.offers', icon: CrateIcon }
const NEEDS: Item = { to: NEED, label: 'nav.needs', icon: KnotPlusIcon }
const ORDERS: Item = { to: '/buyer/orders', label: 'nav.orders', icon: RopeIcon }
const STALL: Item = { to: '/buyer/stall', label: 'nav.stall', icon: StallIcon }

// The dock follows NAV. The phone bar has four tabs and the float button in the middle.
const NAV: Item[] = [PIER, OFFERS, NEEDS, ORDERS, STALL]
const PHONE_TABS: Item[] = [PIER, OFFERS, ORDERS, STALL]
const isActive = (i: Item, path: string) => (i.end ? path === i.to : path.startsWith(i.to))

/* The harbor dock, same as the fisherfolk and admin ones: a slim icon strip that opens on hover or focus and pushes the page. */
const label = 'whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/dock:opacity-100 group-has-[:focus-visible]/dock:opacity-100'
const rowBase = 'relative flex h-12 w-full items-center gap-3 rounded-2xl pl-3 pr-4 text-left text-[15px] font-semibold transition'
const rowIdle = 'text-navy/75 hover:bg-seafoam/70 hover:text-navy'
const rowOn = 'bg-seafoam text-teal'

function ActiveGlow() {
  return (
    <>
      <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-gradient-to-r from-coral/30 via-coral/10 to-transparent" />
      <span aria-hidden="true" className="absolute -left-3 top-3 h-6 w-1 rounded-r-full bg-coral" />
    </>
  )
}

/* The float: the one main action for a buyer is to say what they need. Same buoy as the fisher's log button. */
function FloatButton() {
  const b = useBT()
  return (
    <Link to={`${NEED}?new=1`} aria-label={b('needs.new')} className="relative grid size-16 place-items-center rounded-full bg-coral text-deep shadow-raised transition active:scale-95">
      <svg viewBox="0 0 72 72" className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)]" aria-hidden="true">
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-cream)" strokeWidth="4" strokeDasharray="7 4.4" strokeLinecap="round" />
        <circle cx="36" cy="36" r="33" fill="none" stroke="var(--color-coral)" strokeOpacity="0.5" strokeWidth="1.2" />
      </svg>
      <KnotPlusIcon size={30} />
    </Link>
  )
}

/* The parola: one tap switches between day and night at sea. Its lamp is lit at night. */
function ParolaToggle({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  const t = useT()
  const text = night ? t('adm.day') : t('adm.night')
  return (
    <button
      type="button"
      aria-pressed={night}
      aria-label={text}
      title={text}
      onClick={onToggle}
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

export default function BuyerLayout() {
  const t = useT()
  const b = useBT()
  const user = useUser()
  const { theme, setTheme } = useSettings()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [askLogout, setAskLogout] = useState(false)

  const night = theme === 'night'
  const current = NAV.find((i) => isActive(i, pathname))
  const onSettings = pathname.startsWith('/buyer/settings')
  const title = current ? b(current.label) : onSettings ? t('nav.settings') : pathname.startsWith('/buyer/alerts') ? b('nav.alerts') : 'LAMBAT'
  const place = user.buyer?.businessName ?? t('byr.role')

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop dock: floating, pushes the page when it opens */}
      <div className="group/dock pointer-events-none hidden w-24 shrink-0 transition-[width] duration-300 ease-out hover:w-[264px] has-[:focus-visible]:w-[264px] lg:block">
        <aside
          className="pointer-events-auto fixed bottom-3 left-3 top-3 z-40 flex w-[72px] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card via-card to-seafoam px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] group-hover/dock:w-60 group-has-[:focus-visible]/dock:w-60"
        >
          {/* Brand */}
          <Link to="/buyer" aria-label="LAMBAT" className="mb-5 flex h-12 shrink-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-deep ring-2 ring-coral/80 ring-offset-2 ring-offset-card">
              <Logo size={48} />
            </span>
            <span className={`flex flex-col leading-none ${label}`}>
              <span className="font-display text-xl font-bold tracking-widest text-navy">LAMBAT</span>
              <span className="mt-1 text-xs font-bold tracking-[0.25em] text-teal">{t('byr.role').toUpperCase()}</span>
            </span>
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

          <nav className="flex flex-col gap-1.5" aria-label={t('nav.main')}>
            {NAV.map((item) => {
              const active = item === current
              return (
                <NavLink key={item.to} to={item.to} end={item.end} aria-label={b(item.label)} className={`${rowBase} ${active ? rowOn : rowIdle}`}>
                  {active && <ActiveGlow />}
                  <item.icon size={24} strokeWidth={1.8} className="relative shrink-0" />
                  <span className={`relative ${label}`}>{b(item.label)}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Settings and sign out, kept at the bottom of the dock */}
          <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
            <div aria-hidden="true" className="mb-2 h-px bg-line" />
            <NavLink to="/buyer/settings" aria-label={t('nav.settings')} className={`${rowBase} ${onSettings ? rowOn : rowIdle}`}>
              {onSettings && <ActiveGlow />}
              <Settings size={24} strokeWidth={1.8} className="relative shrink-0" />
              <span className={`relative ${label}`}>{t('nav.settings')}</span>
            </NavLink>
            <button type="button" onClick={() => setAskLogout(true)} aria-label={t('auth.logout')}
              className={`${rowBase} text-navy/75 hover:bg-risk-critical-bg hover:text-risk-critical`}>
              <LogOut size={24} strokeWidth={1.8} className="shrink-0" />
              <span className={label}>{t('auth.logout')}</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="min-w-0 flex-1">
        {/* Top bar: a floating glass bar that lines up with the page content */}
        <header className="sticky top-0 z-30 pt-3">
          <div className="mx-auto max-w-5xl px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3 rounded-3xl border border-line bg-card/80 pl-4 pr-2 shadow-rest backdrop-blur-md">
              {/* Phones and tablets: the logo. Desktop: where you are. */}
              <Link to="/buyer" aria-label="LAMBAT" className="flex items-center gap-2.5 lg:hidden">
                <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-deep ring-2 ring-coral/70">
                  <Logo size={40} />
                </span>
                <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
              </Link>
              <div className="hidden items-center gap-3 lg:flex">
                <span aria-hidden="true" className="h-9 w-1 rounded-full bg-coral" />
                <div className="leading-tight">
                  <p className="font-display text-xl font-bold">{title}</p>
                  <p className="text-sm font-medium text-ink-soft">{place}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ParolaToggle night={night} onToggle={() => setTheme(night ? 'day' : 'night')} />
                <LangToggle />
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <BuyerNotificationsMenu />
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  aria-label={t('hdr.menu')}
                  className="flex items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:pr-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
                  <span className="hidden text-sm font-semibold lg:block">{user.shortName}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10"><Outlet /></main>
      </div>

      {/* Phone bar: four tabs with the "I need" float in the middle */}
      <nav aria-label={t('nav.main')} className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[PHONE_TABS[0], PHONE_TABS[1], null, PHONE_TABS[2], PHONE_TABS[3]].map((item, i) => {
          if (!item) {
            return (
              <div key={i} className="relative flex flex-col items-center justify-end pb-1.5">
                <div className="-mt-8"><FloatButton /></div>
                <span className="mt-1 text-[13px] font-semibold">{b('nav.need')}</span>
              </div>
            )
          }
          const active = isActive(item, pathname)
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold">
              <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
              {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
              <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
                <item.icon size={24} strokeWidth={1.8} />
              </span>
              <span className={active ? 'text-teal' : 'text-navy'}>{b(item.label)}</span>
            </NavLink>
          )
        })}
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title={user.buyer?.businessName ?? t('byr.role')}>
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-soft">{t('byr.role')}</p>
          </div>
        </div>
        <SwitchRow icon={night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />} label={t('menu.night')} hint={t('menu.night.hint')} checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} />
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
          <li>
            <Link to={STALL.to} onClick={() => setMenu(false)} className="flex min-h-14 items-center gap-3 px-4 hover:bg-seafoam/50">
              <StallIcon size={22} strokeWidth={1.8} className="text-teal" />
              {b('nav.stall')}
            </Link>
          </li>
          <li>
            <Link to="/buyer/settings" onClick={() => setMenu(false)} className="flex min-h-14 items-center gap-3 px-4 hover:bg-seafoam/50">
              <Settings size={22} strokeWidth={1.8} aria-hidden className="text-teal" />
              {t('nav.settings')}
            </Link>
          </li>
        </ul>
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