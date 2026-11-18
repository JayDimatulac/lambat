import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Fish, Megaphone, UserCheck, UserPlus } from 'lucide-react'
import { whenLabel, type AdminActivity } from '../../lib/adminApi'
import { Card, Head } from './ui'

type LIcon = ComponentType<{ size?: number; strokeWidth?: number }>
const ICON: Record<AdminActivity['kind'], LIcon> = { buyer: UserPlus, advisory: Megaphone, catch: Fish, user: UserCheck }
const TO: Record<AdminActivity['kind'], string> = {
  buyer: '/admin/verifications',
  user: '/admin/verifications',
  advisory: '/admin/advisories',
  catch: '/admin/listings',
}

// The latest things that happened in the harbor, newest first. Each row opens the page it belongs to.
export default function RecentActivity({ activity }: { activity: AdminActivity[] }) {
  return (
    <Card className="flex-1">
      <Head icon={Clock} title="Recent activity" sub="Latest events across the harbor" />
      {activity.length === 0 && <p className="text-sm text-ink-soft">Nothing has happened yet.</p>}
      <ul className="-my-1.5 divide-y divide-line">
        {activity.map((a) => {
          const I = ICON[a.kind]
          return (
            <li key={a.kind + a.title + a.sub + a.at}>
              <Link to={TO[a.kind]} className="flex min-h-14 items-center gap-3 rounded-xl py-2 transition hover:bg-seafoam/40">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
                  <I size={20} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[15px] leading-tight">{a.title}</b>
                  <span className="block truncate text-sm text-ink-soft">{a.sub}</span>
                </span>
                <time dateTime={a.at} className="shrink-0 text-xs font-semibold text-ink-soft">{whenLabel(a.at)}</time>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}