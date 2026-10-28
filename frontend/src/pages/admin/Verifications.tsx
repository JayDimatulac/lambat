import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FishIcon, PierIcon } from '../../components/icons'
import { SharedFishIcon } from '../../components/home/HomeIcons'
import { useAuth } from '../../lib/auth'
import type { Account, Role, Status } from '../../lib/accounts'
import { MooringIcon, SignalMastIcon } from './AdminIcons'
import type { Ctx } from './data'
import { Chip, Empty, Monogram, PageTitle, Pills, SearchBox, type Icon } from './ui'

const ROLE: Record<Role, { label: string; icon: Icon }> = {
  fisherfolk: { label: 'Fisherfolk', icon: FishIcon },
  buyer: { label: 'Buyer', icon: PierIcon },
  organization: { label: 'Organization', icon: SharedFishIcon },
  admin: { label: 'Admin', icon: SignalMastIcon },
}
const STATUS: Record<Status, { tone: 'wait' | 'ok' | 'no' | 'warn'; label: string }> = {
  PENDING: { tone: 'wait', label: 'Waiting' },
  ACTIVE: { tone: 'ok', label: 'Cleared' },
  REJECTED: { tone: 'no', label: 'Declined' },
  SUSPENDED: { tone: 'warn', label: 'Suspended' },
}
const BUYER_TYPE = { market: 'Market stall', trader: 'Trader', restaurant: 'Restaurant', smokehouse: 'Smokehouse' } as const
const BOAT = { motor: 'Motor boat', paddle: 'Paddle boat', shore: 'From shore' } as const
const GEAR = { net: 'Net', line: 'Line', trap: 'Trap', other: 'Other gear' } as const

const place = (a: Account) => a.buyer?.address || a.fisher?.landing || a.barangay || '—'
const detail = (a: Account) => {
  if (a.buyer) return `${a.buyer.businessName} · ${BUYER_TYPE[a.buyer.buyerType]}`
  if (a.fisher) return [a.fisher.boat ? BOAT[a.fisher.boat] : '', a.fisher.gear.map((g) => GEAR[g]).join(', ')].filter(Boolean).join(' · ')
  return ''
}

const btn = 'min-h-11 rounded-full px-4 text-sm font-semibold transition active:scale-[0.97]'
const primary = `${btn} bg-coral text-deep hover:bg-coral-dark hover:text-white`
const ghost = `${btn} border-[1.5px] border-teal text-teal hover:bg-seafoam/50`

export default function Verifications() {
  const { accounts, setStatus } = useAuth()
  const { toast } = useOutletContext<Ctx>()
  const [status, setStatusF] = useState<Status | 'all'>('PENDING')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [q, setQ] = useState('')
  const [arm, setArm] = useState<string | null>(null)

  const people = accounts.filter((a) => a.role !== 'admin')
  const count = (s: Status) => people.filter((a) => a.status === s).length
  const rows = people.filter((a) => {
    const hay = `${a.name} ${a.mobile} ${place(a)} ${detail(a)}`.toLowerCase()
    return (status === 'all' || a.status === status) && (role === 'all' || a.role === role) && hay.includes(q.trim().toLowerCase())
  })

  const act = (a: Account, to: Status, msg: string) => { setStatus(a.id, to); setArm(null); toast(`${a.name} ${msg}`) }
  // Declining and suspending ask for a second tap, so a slip does not lock someone out
  const confirmed = (key: string, run: () => void) => () => (arm === key ? run() : setArm(key))

  return (
    <div>
      <PageTitle title="Verifications" sub="Decide who may moor at the pier. Buyers and organizations are cleared by you before they can reach fisherfolk." />
      <div className="mb-4 space-y-3">
        <Pills<Status | 'all'> label="Status" value={status} onChange={setStatusF} options={[
          { value: 'PENDING', label: 'Waiting', count: count('PENDING') }, { value: 'ACTIVE', label: 'Cleared', count: count('ACTIVE') },
          { value: 'REJECTED', label: 'Declined', count: count('REJECTED') }, { value: 'SUSPENDED', label: 'Suspended', count: count('SUSPENDED') },
          { value: 'all', label: 'Everyone', count: people.length },
        ]} />
        <div className="flex flex-wrap items-center gap-3">
          <Pills<Role | 'all'> label="Type" value={role} onChange={setRole} options={[
            { value: 'all', label: 'All types' }, { value: 'buyer', label: 'Buyers' }, { value: 'organization', label: 'Organizations' }, { value: 'fisherfolk', label: 'Fisherfolk' },
          ]} />
          <SearchBox value={q} onChange={setQ} placeholder="Search name, number or place" />
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty icon={MooringIcon} title="Nobody is waiting here" sub="Try another status, or clear the search." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((a) => {
            const R = ROLE[a.role]
            const s = STATUS[a.status]
            return (
              <article key={a.id} className="anim-rise flex flex-col gap-3 rounded-lg border border-line bg-card p-4 shadow-rest">
                <div className="flex items-start gap-3">
                  <Monogram text={(a.name.split(' ').map((w) => w[0]).slice(0, 2).join('') || '?').toUpperCase()} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-numeral text-lg font-bold leading-tight">{a.name}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-ink-soft"><R.icon size={18} className="text-teal" />{R.label}</p>
                  </div>
                  <Chip tone={s.tone}>{s.label}</Chip>
                </div>
                <dl className="space-y-0.5 text-sm">
                  {detail(a) && <dd>{detail(a)}</dd>}
                  <dd className="text-ink-soft">{place(a)}{a.mobile ? ` · ${a.mobile}` : ''}</dd>
                  <dd className="text-xs text-ink-soft">Joined {new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  {a.status === 'PENDING' && (
                    <>
                      <button type="button" className={primary} onClick={() => act(a, 'ACTIVE', 'is cleared to moor')}>Approve</button>
                      <button type="button" className={ghost} onBlur={() => setArm(null)} onClick={confirmed(`${a.id}:no`, () => act(a, 'REJECTED', 'was declined'))}>{arm === `${a.id}:no` ? 'Tap again to decline' : 'Decline'}</button>
                    </>
                  )}
                  {a.status === 'ACTIVE' && (
                    <button type="button" className={ghost} onBlur={() => setArm(null)} onClick={confirmed(`${a.id}:sus`, () => act(a, 'SUSPENDED', 'was suspended'))}>{arm === `${a.id}:sus` ? 'Tap again to suspend' : 'Suspend'}</button>
                  )}
                  {(a.status === 'REJECTED' || a.status === 'SUSPENDED') && (
                    <button type="button" className={primary} onClick={() => act(a, 'ACTIVE', 'is cleared again')}>{a.status === 'SUSPENDED' ? 'Reinstate' : 'Approve after all'}</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}