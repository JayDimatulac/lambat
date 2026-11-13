import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { CloudSun, Sparkles } from 'lucide-react'
import { PierIcon } from '../icons'
import { useT, type Key } from '../../lib/i18n'

// Three shortcuts under the Log a catch button. Log a catch is NOT repeated here:
// the coral bar above is the one primary action, so these stay calm and neutral.
type Icon = ComponentType<{ size?: number; strokeWidth?: number }>
const ACTIONS: { to: string; title: Key; sub: Key; Icon: Icon }[] = [
  { to: '/weather', title: 'home.q.weather', sub: 'home.q.weather.sub', Icon: CloudSun },
  { to: '/buyers', title: 'home.q.buyers', sub: 'home.q.buyers.sub', Icon: PierIcon },
  { to: '/value-added', title: 'home.q.value', sub: 'home.q.value.sub', Icon: Sparkles },
]

export default function QuickActions() {
  const t = useT()
  return (
    <nav aria-label={t('home.q.label')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ACTIONS.map(({ to, title, sub, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-card p-3.5 shadow-rest transition hover:bg-seafoam active:scale-[0.98] sm:flex-col sm:justify-center sm:gap-2 sm:py-4 sm:text-center"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
            <Icon size={26} strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block font-numeral text-base font-bold leading-tight">{t(title)}</span>
            <span className="simple-hide mt-0.5 block text-xs font-medium leading-snug text-ink-soft">{t(sub)}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}