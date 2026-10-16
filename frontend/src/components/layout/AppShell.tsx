import { useState, type ComponentType } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Check, CloudSun, Send, Sparkles, Wifi, WifiLow, WifiOff } from 'lucide-react'
import { BuoyIcon, FishIcon, KnotPlusIcon, PierIcon, TideIcon } from '../icons'
import { useT, type Key } from '../../lib/i18n'
import { useSettings } from '../../lib/settings'
import { user } from '../../data/mock'
import LangToggle from './LangToggle'
import MenuSheet from './MenuSheet'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type Item = { to: string; label: Key; icon: Icon; end?: boolean }

const tabs: Item[] = [
  { to: '/', label: 'nav.home', icon: TideIcon, end: true },
  { to: '/catches', label: 'nav.catches', icon: FishIcon },
  { to: '/weather', label: 'nav.weather', icon: CloudSun },
  { to: '/buyers', label: 'nav.buyers', icon: PierIcon },
]
const railItems: Item[] = [...tabs, { to: '/value-added', label: 'nav.value', icon: Sparkles }]

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

/* A strand between two knots on the rail: slack normally, pulled straight next to the active item. */
function Strand({ taut }: { taut: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true" className="shrink-0">
      <path d={taut ? 'M7 0V18' : 'M7 0Q1 9 7 18'} stroke={taut ? 'var(--color-teal)' : 'var(--color-line)'} strokeWidth={taut ? 2.2 : 1.8} strokeLinecap="round" style={{ transition: 'd 0.3s' }} />
    </svg>
  )
}

function Rail() {
  const t = useT()
  const { pathname } = useLocation()
  const activeIdx = railItems.findIndex((i) => isActive(i, pathname))
  return (
    <aside className="net-mesh sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center overflow-y-auto border-r border-line bg-card py-4 lg:flex">
      <Link to="/" className="mb-4 flex flex-col items-center gap-1 text-navy">
        <BuoyIcon size={30} className="text-teal" />
        <span className="font-display text-sm font-bold tracking-wider">LAMBAT</span>
      </Link>
      <div className="mb-3 flex flex-col items-center gap-1">
        <FloatButton size="sm" />
        <span className="text-[13px] font-semibold">{t('nav.log')}</span>
      </div>
      <nav className="flex flex-col items-center" aria-label={t('nav.main')}>
        {railItems.map((item, i) => {
          const active = i === activeIdx
          return (
            <div key={item.to} className="flex flex-col items-center">
              <Strand taut={active || i - 1 === activeIdx} />
              <NavLink
                to={item.to}
                end={item.end}
                className={`flex min-h-14 w-20 flex-col items-center gap-1 rounded-md px-1 py-2 text-center text-[13px] font-semibold leading-tight transition ${active ? 'bg-seafoam text-teal' : 'text-navy hover:bg-seafoam/60'}`}
              >
                <item.icon size={24} strokeWidth={1.8} />
                {t(item.label)}
              </NavLink>
            </div>
          )
        })}
      </nav>
    </aside>
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

function ConnectionChip() {
  const t = useT()
  const { connection } = useSettings()
  const map = {
    online: { icon: Wifi, text: t('conn.online'), cls: 'text-risk-low' },
    weak: { icon: WifiLow, text: t('conn.weak'), cls: 'text-risk-moderate' },
    offline: { icon: WifiOff, text: t('conn.offline'), cls: 'text-risk-high' },
  }[connection]
  return (
    <span role="status" className={`hidden min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold sm:inline-flex ${map.cls}`}>
      <map.icon size={18} strokeWidth={1.8} aria-hidden />
      {map.text}
    </span>
  )
}

/* Shows only when the signal is weak or gone. The SMS button is a UI demo: nothing is sent yet. */
function ConnectionBar() {
  const t = useT()
  const { connection } = useSettings()
  const [queued, setQueued] = useState(false)
  if (connection === 'online') return null
  const weak = connection === 'weak'
  return (
    <div role="status" className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 lg:px-8 ${weak ? 'border-risk-moderate-line bg-risk-moderate-bg text-risk-moderate' : 'border-risk-high-line bg-risk-high-bg text-risk-high'}`}>
      <p className="flex items-center gap-2 font-semibold">
        {weak ? <WifiLow size={20} strokeWidth={1.8} aria-hidden /> : <WifiOff size={20} strokeWidth={1.8} aria-hidden />}
        {weak ? t('conn.weak.msg') : t('conn.offline.msg')}
      </p>
      <button
        type="button"
        disabled={queued}
        onClick={() => setQueued(true)}
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-current bg-card px-4 text-sm font-semibold"
      >
        {queued ? <Check size={18} strokeWidth={1.8} aria-hidden /> : <Send size={18} strokeWidth={1.8} aria-hidden />}
        {queued ? t('conn.sms.done') : t('conn.sms')}
      </button>
    </div>
  )
}

export default function AppShell() {
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-dvh lg:flex">
      <Rail />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line bg-card/90 px-4 backdrop-blur lg:px-8">
          <Link to="/" className="flex items-center gap-2 lg:invisible">
            <BuoyIcon size={26} className="text-teal" />
            <span className="font-display text-xl font-bold tracking-wider">LAMBAT</span>
          </Link>
          <div className="flex items-center gap-2">
            <ConnectionChip />
            <LangToggle />
            <Link to="/notifications" aria-label={t('nav.alerts')} className="relative grid size-12 place-items-center rounded-full hover:bg-seafoam">
              <Bell size={24} strokeWidth={1.8} aria-hidden />
              <span className="absolute right-3 top-3 size-2.5 rounded-full bg-coral" aria-hidden="true" />
            </Link>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label={t('hdr.menu')} className="grid size-12 place-items-center rounded-full bg-teal text-sm font-bold text-on-accent">
              {user.initials}
            </button>
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