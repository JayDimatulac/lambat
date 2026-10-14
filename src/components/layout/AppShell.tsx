import { Bell, CloudSun, Fish, Home, PlusCircle,Sparkles, UserRound, Settings, Store } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: Home, end: true },
  { to: '/catches', label: 'Mga Huli Ko', short: 'Catch', icon: Fish },
  { to: '/weather', label: 'Panahon', short: 'Weather', icon: CloudSun },
  { to: '/buyers', label: 'Mamimili', short: 'Buyers', icon: Store },
  { to: '/value-added', label: 'Pagpapalaki ng Halaga', short: 'Value-added', icon: Sparkles },
  { to: '/notifications', label: 'Mga Abiso', short: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Aking Profile', short: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Mga Setting', short: 'Settings', icon: Settings },
]

const ico = { size: 22, strokeWidth: 1.8, strokeLinecap: 'round' as const }
const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center text-xs ${isActive ? 'font-semibold text-teal' : 'text-ink-soft'}`

const pick = (...to: string[]) => nav.filter(n => to.includes(n.to))
const mobileLeft = pick ('/', '/catches', '/weather','/buyers')
const mobileRight = pick('/value-added', '/notifications', '/profile','/settings')

export default function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white p-4 lg:flex">
        <p className="px-2 pb-4 font-display text-2xl font-bold tracking-wide">LAMBAT</p>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-seafoam text-teal' : 'text-navy hover:bg-mint'
                }`
              }
            >
              <Icon {...ico} size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/catches/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-md bg-coral px-4 py-3 text-sm font-semibold text-white hover:bg-coral-dark"
        >
          <PlusCircle size={20} strokeWidth={1.8} aria-hidden /> Itala ang Huli
        </Link>
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
          <span className="grid size-9 place-items-center rounded-full bg-teal text-xs font-bold text-white">MR</span>
          <span className="text-sm leading-tight">
            <b className="block font-semibold">Mang Ramon</b>
            <span className="text-ink-soft">Batangas City</span>
          </span>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:px-10">
          <span className="font-display text-lg font-semibold lg:hidden">LAMBAT</span>
          <span className="hidden lg:block" />
          <Link to="/notifications" aria-label="Mga Abiso" className="relative p-2">
            <Bell {...ico} aria-hidden />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-coral" />
          </Link>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-10 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center border-t border-line bg-white px-2 py-2 lg:hidden">
        <div className="flex flex-1 justify-around">
          {mobileLeft.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={tab}>
              <Icon {...ico} aria-hidden /> {short}
            </NavLink>
          ))}
        </div>

        <Link
          to="/catches/new"
          className="mx-2 flex shrink-0 items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white shadow-raised active:scale-[0.96]"
        >
          <PlusCircle size={20} strokeWidth={1.8} aria-hidden /> Itala
        </Link>

        <div className="flex flex-1 justify-around">
          {mobileRight.map(({ to, short, icon: Icon }) => (
            <NavLink key={to} to={to} className={tab}>
              <Icon {...ico} aria-hidden /> {short}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
