import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Fish, Megaphone, UserCheck, UserPlus } from 'lucide-react'
import { ACTIVITY, type Activity } from './data'
import { Card, Head } from './ui'

type LIcon = ComponentType<{ size?: number; strokeWidth?: number }>
const ICON: Record<Activity['kind'], LIcon> = { buyer: UserPlus, advisory: Megaphone, catch: Fish, user: UserCheck }

// The latest things that happened in the harbor, newest first. Each row opens the page it belongs to.
export default function RecentActivity() {
  return (
    <Card className="flex-1">
      <Head icon={Clock} title="Recent activity" sub="Latest events across the harbor" />
      <ul className="-my-1.5 divide-y divide-line">
        {ACTIVITY.map((a) => {
          const I = ICON[a.kind]
          return (
            <li key={a.title + a.sub}>
              <Link to={a.to} className="flex min-h-14 items-center gap-3 rounded-xl py-2 transition hover:bg-seafoam/40">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
                  <I size={20} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[15px] leading-tight">{a.title}</b>
                  <span className="block truncate text-sm text-ink-soft">{a.sub}</span>
                </span>
                <time className="shrink-0 text-xs font-semibold text-ink-soft">{a.when}</time>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}