import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronRight, ClipboardList, Fish, MapPin, Megaphone, ShoppingCart, UserCheck, UserPlus, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { fmtWeight, useAdminOverview } from '../../lib/adminApi'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { Badge, Empty, Panel, Pick, Tile, btnPrimary, type LIcon } from './AdminBits'
import { WaveLines } from './Charts'
import { audKey, useA, type AKey } from './adminText'
import { DAY, PERIODS, areaOf, areasOf, bucketSeries, type Period } from './adminStats'

type Adv = { id: string; title: string; audience: string | null; active: boolean; expiresAt: string | null; createdAt: string }

const KIND: Record<string, LIcon> = { buyer: UserPlus, advisory: Megaphone, catch: Fish, user: UserCheck }

export default function SuperOverview() {
  const A = useA()
  const { lang } = useSettings()
  const { data, error, loading } = useAdminOverview()
  const { accounts } = useAuth()
  const [period, setPeriod] = useState<Period>('30')
  const [area, setArea] = useState('')
  const [adv, setAdv] = useState<Adv[]>([])

  useEffect(() => {
    let on = true
    api.get<Adv[]>('/advisories/all').then((r) => { if (on) setAdv(r) }).catch(() => {})
    return () => { on = false }
  }, [])

  if (loading) return <p className="p-6 text-ink-soft">{A('c.loading')}</p>
  if (error || !data) return <p className="p-6 text-risk-high">{A('c.error')}</p>

  const loc = localeOf(lang)
  const now = Date.now()
  const everyone = accounts.filter((a) => a.role === 'fisherfolk' || a.role === 'buyer' || a.role === 'organization')
  const people = everyone.filter((a) => !area || areaOf(a) === area)
  const earliest = people.reduce((m, a) => Math.min(m, a.createdAt), now)
  const from = period === 'all' ? Math.min(earliest, now - 30 * DAY) : now - Number(period) * DAY

  const fishers = people.filter((a) => a.role === 'fisherfolk' && a.status === 'ACTIVE').length
  const buyers = people.filter((a) => a.role === 'buyer' && a.status === 'ACTIVE').length
  const waiting = people.filter((a) => a.status === 'PENDING').length
  const live = adv
    .filter((r) => r.active && (!r.expiresAt || new Date(r.expiresAt).getTime() > now))
    .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())

  const points = bucketSeries(people, from, now)

  const o = data.outcomes
  const kg = (n: number) => { const f = fmtWeight(n); return `${f.value} ${f.unit}` }
  const parts = [
    { name: A('rp.sold'), n: o.SOLD, color: 'var(--color-teal)' },
    { name: A('rp.shared'), n: o.REDISTRIBUTED, color: 'var(--color-risk-low-line)' },
    { name: A('rp.lost'), n: o.DISCARDED, color: 'var(--color-coral)' },
  ]
  const total = parts.reduce((s, p) => s + p.n, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Pick icon={CalendarDays} value={period} onChange={(v) => setPeriod(v as Period)} label={A('c.r.all')}>
          {PERIODS.map((p) => <option key={p.k} value={p.k}>{A(`c.r.${p.k}` as AKey)}</option>)}
        </Pick>
        <Pick icon={MapPin} value={area} onChange={setArea} label={A('ov.munis')}>
          <option value="">{A('ov.munis')}</option>
          {areasOf().map((m) => <option key={m} value={m}>{m}</option>)}
        </Pick>
        <Link to="/admin/admins" className={`${btnPrimary} ml-auto !min-h-12 !rounded-xl`}>
          <Users size={20} strokeWidth={1.8} aria-hidden />{A('ov.manage')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={Users} label={A('ov.fisher')} value={fishers} tone="blue" />
        <Tile icon={ShoppingCart} label={A('ov.buyers')} value={buyers} tone="green" to="/admin/verifications" />
        <Tile icon={ClipboardList} label={A('ov.pending')} value={waiting} tone="amber" to="/admin/verifications" />
        <Tile icon={Megaphone} label={A('ov.live')} value={live.length} tone="red" to="/admin/advisory-review" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel icon={ClipboardList} title={A('ov.verify')}>
          <WaveLines
            data={points.map((p) => ({ label: p.label, values: [p.fisher, p.buyer] }))}
            colors={['var(--color-teal)', 'var(--color-coral)']}
            names={[A('ar.aud.fisher'), A('ar.aud.buyer')]}
            height={230}
            empty={A('ov.noapps')}
          />
        </Panel>

        <Panel
          flush
          icon={Megaphone}
          title={A('ov.advisory')}
          action={<Link to="/admin/advisory-review" className="type-link inline-flex items-center gap-1 hover:underline">{A('ov.all')} <ArrowRight size={15} aria-hidden /></Link>}
        >
          {live.length === 0 ? (
            <Empty icon={Megaphone} text={A('ar.empty.published')} />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {live.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <Link to="/admin/advisory-review" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-seafoam/30">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-seafoam text-teal"><Megaphone size={20} strokeWidth={1.8} /></span>
                    <span className="min-w-0 flex-1">
                      <b className="type-body-medium block truncate">{r.title}</b>
                      <span className="type-caption mt-0.5 flex items-center gap-2 text-ink-soft">
                        <Badge tone="slate">{A(audKey(r.audience))}</Badge>
                        {new Date(r.createdAt).toLocaleDateString(loc, { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Panel icon={Fish} title={A('ov.outcomes')} center>
          <div className="flex h-3 overflow-hidden rounded-full bg-line/60">
            {total > 0 && parts.map((p) => <div key={p.name} style={{ background: p.color, width: `${(p.n / total) * 100}%` }} />)}
          </div>
          <ul className="mt-5 divide-y divide-line">
            {parts.map((p) => (
              <li key={p.name} className="flex items-center gap-3 py-3.5">
                <i className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="type-body-medium flex-1">{p.name}</span>
                <b className="type-body-medium tabular-nums">{kg(p.n)}</b>
                <span className="type-caption w-12 text-right tabular-nums text-ink-soft"></span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          flush
          icon={ClipboardList}
          title={A('ov.recent')}
          action={<Link to="/admin/activity" className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">{A('ov.log')} <ArrowRight size={15} aria-hidden /></Link>}
        >
          <ul className="divide-y divide-line border-t border-line">
            {data.activity.length === 0 && <li className="type-body px-5 py-8 text-center text-ink-soft">{A('ov.nothing')}</li>}
            {data.activity.slice(0, 5).map((a, i) => {
              const I = KIND[a.kind] ?? UserCheck
              return (
                <li key={i} className="type-body flex items-center gap-3 px-5 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><I size={16} strokeWidth={1.8} /></span>
                  <span className="min-w-0 flex-1 truncate"><span className="type-body-medium">{a.title}</span> <span className="text-ink-soft">– {a.sub}</span></span>
                  <span className="type-caption shrink-0 text-ink-soft"></span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}