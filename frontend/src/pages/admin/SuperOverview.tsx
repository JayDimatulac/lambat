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

// translated titles for the recent activity list, keyed by the activity kind from the backend
const ACT: Record<string, AKey> = {
  catch: 'ov.act.catch',
  user: 'ov.act.user',
  advisory: 'ov.act.advisory',
  buyer: 'ov.act.buyer',
}

// known advisory categories (the part before " · "); anything unknown keeps its original text
const ADV_TITLES: Record<string, AKey> = {
  'Weather / sea condition': 'adv.t.weather',
}

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

  // "Weather / sea condition · Balayan Bay" -> translate the category, keep the place
  const advTitle = (t: string) => {
    const [head, ...rest] = t.split(' · ')
    const k = ADV_TITLES[head.trim()]
    return k ? [A(k), ...rest].join(' · ') : t
  }

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
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  // the chart groups by day up to 31 days, and by week beyond that (same rule as bucketSeries)
  const weekly = Math.max(DAY, now - from) > 31 * DAY

  // "5 mins ago", "2 hours ago", "Yesterday", then a date once it is a week old
  const ago = (iso: string) => {
    const d = new Date(iso)
    const min = Math.floor((Date.now() - d.getTime()) / 60000)
    if (min < 1) return A('ago.now')
    if (min < 60) return min === 1 ? A('ago.min1') : A('ago.mins', { n: min })
    const midnight = new Date().setHours(0, 0, 0, 0)
    if (d.getTime() >= midnight) {
      const h = Math.floor(min / 60)
      return h === 1 ? A('ago.hr1') : A('ago.hrs', { n: h })
    }
    const days = Math.round((midnight - new Date(d).setHours(0, 0, 0, 0)) / DAY)
    if (days === 1) return A('ago.yest')
    if (days < 7) return A('ago.days', { n: days })
    return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' })
  }

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
        <Panel icon={ClipboardList} title={A('ov.verify')} sub={A(weekly ? 'ov.verify.week' : 'ov.verify.day')}>
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
          action={<Link to="/admin/advisory-review" className="type-link-strong group -mr-2.5 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 underline-offset-4 transition hover:bg-seafoam/50 hover:underline">{A('ov.all')} <ArrowRight size={18} strokeWidth={2.2} aria-hidden className="transition group-hover:translate-x-0.5" /></Link>}
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
                      <b className="type-body-medium block truncate">{advTitle(r.title)}</b>
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
                <span className="type-label w-14 shrink-0 rounded-full py-0.5 text-center tabular-nums" style={{ background: `color-mix(in srgb, ${p.color} 22%, transparent)` }}>{pct(p.n)}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          flush
          icon={ClipboardList}
          title={A('ov.recent')}
          action={<Link to="/admin/activity" className="type-link-strong group -mr-2.5 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 underline-offset-4 transition hover:bg-seafoam/50 hover:underline">{A('ov.log')} <ArrowRight size={18} strokeWidth={2.2} aria-hidden className="transition group-hover:translate-x-0.5" /></Link>}
        >
          <ul className="divide-y divide-line border-t border-line">
            {data.activity.length === 0 && <li className="type-body px-5 py-8 text-center text-ink-soft">{A('ov.nothing')}</li>}
            {data.activity.slice(0, 5).map((a, i) => {
              const I = KIND[a.kind] ?? UserCheck
              return (
                <li key={i} className="type-body flex items-center gap-3 px-5 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-seafoam text-teal"><I size={16} strokeWidth={1.8} /></span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="type-body-medium">{ACT[a.kind] ? A(ACT[a.kind]) : a.title}</span>{' '}
                    <span className="text-ink-soft">– {a.kind === 'advisory' ? advTitle(a.sub) : a.sub}</span>
                  </span>
                  <time dateTime={a.at} title={new Date(a.at).toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' })} className="type-caption shrink-0 text-ink-soft">{ago(a.at)}</time>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}