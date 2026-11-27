import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList, MapPin, Megaphone, Plus, TriangleAlert, XCircle } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Pick } from './AdminBits'
import ApplicationsQueue from './ApplicationsQueue'
import { areaOf, areasOf } from './adminStats'

type LIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

const TINT = {
  blue: ['bg-seafoam/70', 'text-teal'],
  amber: ['bg-risk-moderate-bg', 'text-risk-moderate'],
  green: ['bg-risk-low-bg', 'text-risk-low'],
  red: ['bg-risk-critical-bg', 'text-risk-critical'],
} as const

function Tile({ icon: Icon, label, value, tone, hint }: { icon: LIcon; label: string; value: number | string; tone: keyof typeof TINT; hint?: string }) {
  const [bg, ink] = TINT[tone]
  return (
    <div title={hint} className={`flex min-w-0 flex-col items-start gap-2 rounded-lg border border-line p-3 shadow-rest sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${bg}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-card/70 sm:size-14 ${ink}`}><Icon size={28} strokeWidth={1.8} /></span>
      <span className="min-w-0 max-w-full">
        <span className="block text-sm font-semibold leading-tight sm:text-base">{label}</span>
        <b className="block font-numeral text-3xl font-bold leading-tight sm:text-4xl">{value}</b>
      </span>
    </div>
  )
}

export default function AdminHome() {
  const { accounts } = useAuth()
  const [area, setArea] = useState('')

  const people = accounts.filter((a) => a.role === 'fisherfolk' || a.role === 'buyer' || a.role === 'organization')
  const pending = people.filter((a) => a.status === 'PENDING' && (!area || areaOf(a) === area)).length
  const areas = areasOf(people)
  const later = 'Available once decisions are recorded with the verification records'

  return (
    <div className="space-y-5">
      <div>
        <Pick icon={MapPin} value={area} onChange={setArea} label="Area">
          <option value="">All areas</option>
          {areas.map((p) => <option key={p} value={p}>{p}</option>)}
        </Pick>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile icon={ClipboardList} label="Pending" value={pending} tone="blue" />
        <Tile icon={TriangleAlert} label="Needs Correction" value={0} tone="amber" hint="Needs the correction status, added with the verification records" />
        <Tile icon={CheckCircle2} label="Approved Today" value="—" tone="green" hint={later} />
        <Tile icon={XCircle} label="Rejected Today" value="—" tone="red" hint={later} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <ApplicationsQueue area={area} pageSize={5} />

        <section className="rounded-lg border border-line bg-card p-5 shadow-rest">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Megaphone size={26} strokeWidth={1.8} aria-hidden className="mt-0.5 shrink-0 text-teal" />
              <h2 className="font-display text-2xl font-bold leading-tight">Advisory Drafts</h2>
            </div>
            <Link to="/admin/advisories" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-teal px-4 text-sm font-bold text-on-accent shadow-rest transition hover:brightness-110">
              <Plus size={18} strokeWidth={2.4} aria-hidden />Create draft
            </Link>
          </div>
          <p className="mt-2 text-sm text-ink-soft">Prepare fisheries advisories for internal review.</p>
          <div className="mt-4 rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">
            No drafts yet. Saved drafts and "Send for review" appear here once the advisory review step is built.
          </div>
        </section>
      </div>
    </div>
  )
}