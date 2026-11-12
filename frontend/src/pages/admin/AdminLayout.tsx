import { useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Fish, Hourglass, LayoutDashboard, LogOut, Megaphone, ShieldCheck, UserCheck } from 'lucide-react'
import Sheet from '../../components/ui/Sheet'
import LogoutSheet from '../../components/auth/LogoutSheet'
import LangToggle from '../../components/layout/LangToggle'
import Logo from '../../components/Logo'
import { TideIcon } from '../../components/icons'
import { useAuth, useUser } from '../../lib/auth'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import { MoonTideIcon } from './AdminIcons'
import type { Ctx } from './data'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: Key; icon: Icon; end?: boolean }
const NAV: Item[] = [
  { to: '/admin', label: 'adm.nav.overview', icon: LayoutDashboard, end: true },
  { to: '/admin/verifications', label: 'adm.nav.verify', icon: UserCheck },
  { to: '/admin/listings', label: 'adm.nav.catches', icon: Fish },
  { to: '/admin/advisories', label: 'adm.nav.advisories', icon: Megaphone },
  { to: '/admin/reference', label: 'adm.nav.shelf', icon: Hourglass },
]
const isActive = (i: Item, path: string) => (i.end ? path === i.to : path.startsWith(i.to))

/* The harbor dock, same as the fisherfolk one: a slim icon strip that opens on hover or focus and pushes the page. */
const label = 'whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/dock:opacity-100 group-has-[:focus-visible]/dock:opacity-100'
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

const Count = ({ n, className }: { n: number; className: string }) =>
  n > 0 ? <em className={`absolute min-w-5 rounded-full bg-coral px-1.5 text-center text-xs font-bold not-italic text-deep ${className}`}>{n}</em> : null

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

export default function AdminLayout() {
  const t = useT()
  const user = useUser()
  const { accounts } = useAuth()
  const { theme, setTheme } = useSettings()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const [msg, setMsg] = useState('')

  // real accounts waiting for approval (buyers sign up on their own; organizations are made by an admin)
  const pending = accounts.filter((a) => a.role !== 'admin' && a.status === 'PENDING').length
  const night = theme === 'night'
  const current = NAV.find((i) => isActive(i, pathname))
  const toast = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 2400) }
  const ctx: Ctx = { toast }

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop dock: floating, pushes the page when it opens */}
      <div className="group/dock pointer-events-none hidden w-24 shrink-0 transition-[width] duration-300 ease-out hover:w-[264px] has-[:focus-visible]:w-[264px] lg:block">
        <aside
          className="pointer-events-auto fixed bottom-3 left-3 top-3 z-40 flex w-[72px] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-line bg-gradient-to-b from-card via-card to-seafoam px-3 py-4 shadow-raised transition-[width] duration-300 ease-out [scrollbar-width:none] group-hover/dock:w-60 group-has-[:focus-visible]/dock:w-60"
        >
          {/* Brand */}
          <Link to="/admin" aria-label="LAMBAT admin" className="mb-5 flex h-12 shrink-0 items-center gap-3">
            <Logo size={48} className="size-12" />
            <span className={`flex flex-col leading-none ${label}`}>
              <span className="font-display text-xl font-bold tracking-widest text-navy">LAMBAT</span>
              <span className="mt-1 text-xs font-bold tracking-[0.25em] text-teal">ADMIN</span>
            </span>
          </Link>

          {/* The one primary action: approve waiting accounts */}
          <Link
            to="/admin/verifications"
            aria-label={t('adm.verify.cta')}
            className="relative flex h-12 shrink-0 items-center gap-3 rounded-full bg-coral pl-3 pr-5 font-bold text-deep shadow-raised transition hover:bg-peach active:scale-95"
          >
            <ShieldCheck size={24} strokeWidth={1.8} className="shrink-0" />
            <span className={label}>{t('adm.verify.cta')}</span>
            {pending > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-deep px-1.5 text-xs font-bold text-white ring-2 ring-card">
                {pending}
              </span>
            )}
          </Link>

          <div aria-hidden="true" className="my-4 h-px shrink-0 bg-line" />

          <nav className="flex flex-col gap-1.5" aria-label="Admin">
            {NAV.map((item) => {
              const active = item === current
              return (
                <NavLink key={item.to} to={item.to} end={item.end} aria-label={t(item.label)} className={`${rowBase} ${active ? rowOn : rowIdle}`}>
                  {active && <ActiveGlow />}
                  <span className="relative shrink-0">
                    <item.icon size={24} strokeWidth={1.8} />
                    {item.to.endsWith('verifications') && <Count n={pending} className="-right-2 -top-2" />}
                  </span>
                  <span className={`relative ${label}`}>{t(item.label)}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Sign out, kept at the bottom of the dock */}
          <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-4">
            <div aria-hidden="true" className="mb-2 h-px bg-line" />
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
        <header className="sticky top-0 z-20 pt-3">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3 rounded-3xl border border-line bg-card/80 pl-4 pr-2 shadow-rest backdrop-blur-md">
              {/* Phones and tablets: the logo. Desktop: where you are. */}
              <Link to="/admin" aria-label="LAMBAT admin" className="flex items-center gap-2.5 lg:hidden">
                <Logo size={40} className="size-10" />
                <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
              </Link>
              <div className="hidden items-center gap-3 lg:flex">
                <span aria-hidden="true" className="h-9 w-1 rounded-full bg-coral" />
                <div className="leading-tight">
                  <p className="font-display text-xl font-bold">{current ? t(current.label) : 'Admin'}</p>
                  <p className="text-sm font-medium text-ink-soft">{t('adm.role')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {pending > 0 && (
                  <Link to="/admin/verifications" className="hidden min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-teal transition hover:bg-seafoam/60 sm:inline-flex">
                    <UserCheck size={18} strokeWidth={1.8} />{t('adm.waiting', { n: pending })}
                  </Link>
                )}
                <ParolaToggle night={night} onToggle={() => setTheme(night ? 'day' : 'night')} />
                <LangToggle />
                <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line sm:block" />
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  aria-label={t('adm.account')}
                  className="flex items-center gap-2 rounded-full bg-seafoam p-1 transition hover:brightness-95 lg:pr-3"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">{user.initials}</span>
                  <span className="hidden text-sm font-semibold lg:block">{user.name}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 lg:px-8 lg:pb-10"><Outlet context={ctx} /></main>
      </div>

      {/* Phone bar */}
      <nav aria-label="Admin" className="net-mesh fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map((item) => {
          const active = item === current
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold">
              <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 rounded-full ${active ? '-top-1 size-2.5 bg-teal' : '-top-0.5 size-1.5 bg-line'}`} />
              {active && <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-teal" />}
              <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-seafoam text-teal' : 'text-navy'}`}>
                <item.icon size={24} strokeWidth={1.8} />
                {item.to.endsWith('verifications') && <Count n={pending} className="-right-1 -top-1" />}
              </span>
              <span className={`max-w-full truncate px-0.5 ${active ? 'text-teal' : 'text-navy'}`}>{t(item.label)}</span>
            </NavLink>
          )
        })}
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title={t('adm.role')}>
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-teal font-bold text-on-accent">{user.initials}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-soft">{t('adm.role')}</p>
          </div>
        </div>
        <SwitchRow icon={night ? <TideIcon size={24} /> : <MoonTideIcon size={24} />} label={t('menu.night')} hint={t('menu.night.hint')} checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} />
        <button type="button" onClick={() => { setMenu(false); setAskLogout(true) }}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-base font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} />
          {t('auth.logout')}
        </button>
      </Sheet>
      <LogoutSheet open={askLogout} onClose={() => setAskLogout(false)} />

      <div role="status" className={`fixed bottom-24 right-4 z-40 rounded-md bg-deep px-4 py-3 font-semibold text-white shadow-raised transition lg:bottom-6 lg:right-6 ${msg ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}>{msg}</div>
    </div>
  )
}