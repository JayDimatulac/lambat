import { useEffect, useState } from 'react'
import { CalendarDays, Fish, Info, Megaphone, Search, UserPlus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { localeOf } from '../../lib/time'
import { Empty, Pager, Panel, Pick, Seg, inputCls, type LIcon } from './AdminBits'
import { ROLE_KEY, audKey, useA } from './adminText'
import { DAY } from './adminStats'

type Kind = 'account' | 'advisory' | 'catch'
type Entry = { id: string; kind: Kind; at: number; title: string; sub: string }
type AdvRow = { id: string; title: string; audience: string | null; createdAt: string }
type CatchRow = { id: string; kilos: number; createdAt: string; user: { name: string }; species: { englishName: string } }

const PAGE = 10
const ICON: Record<Kind, LIcon> = { account: UserPlus, advisory: Megaphone, catch: Fish }

export default function ActivityLog() {
  const A = useA()
  const { lang } = useSettings()
  const { accounts } = useAuth()
  const [adv, setAdv] = useState<AdvRow[]>([])
  const [catches, setCatches] = useState<CatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [partial, setPartial] = useState(false)
  const [kind, setKind] = useState<'all' | Kind>('all')
  const [range, setRange] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const loc = localeOf(lang)

  useEffect(() => {
    let on = true
    Promise.allSettled([api.get<AdvRow[]>('/advisories/all'), api.get<CatchRow[]>('/admin/catches?limit=200')]).then(([x, y]) => {
      if (!on) return
      if (x.status === 'fulfilled' && Array.isArray(x.value)) setAdv(x.value)
      if (y.status === 'fulfilled' && Array.isArray(y.value)) setCatches(y.value)
      setPartial(x.status === 'rejected' || y.status === 'rejected')
      setLoading(false)
    })
    return () => { on = false }
  }, [])

  const entries: Entry[] = [
    ...accounts.map((a) => ({
      id: `u-${a.id}`, kind: 'account' as const, at: a.createdAt,
      title: a.buyer?.businessName ?? a.name,
      sub: `${A(ROLE_KEY[a.role] ?? 'role.admin')} · ${A('al.registered')}`,
    })),
    ...adv.map((r) => ({
      id: `a-${r.id}`, kind: 'advisory' as const, at: new Date(r.createdAt).getTime(),
      title: r.title, sub: `${A('al.published')} · ${A(audKey(r.audience))}`,
    })),
    ...catches.map((c) => ({
      id: `c-${c.id}`, kind: 'catch' as const, at: new Date(c.createdAt).getTime(),
      title: `${c.species.englishName} · ${Math.round(c.kilos)} kg`, sub: `${A('al.logged')} · ${c.user.name}`,
    })),
  ].sort((x, y) => y.at - x.at)

  const needle = q.trim().toLowerCase()
  const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * DAY
  const shown = entries.filter((e) => (kind === 'all' || e.kind === kind) && e.at >= cutoff && (!needle || `${e.title} ${e.sub}`.toLowerCase().includes(needle)))
  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = shown.slice((cur - 1) * PAGE, cur * PAGE)
  const from = shown.length === 0 ? 0 : (cur - 1) * PAGE + 1

  const when = (ts: number) =>
    `${new Date(ts).toLocaleDateString(loc, { month: 'short', day: 'numeric' })} · ${new Date(ts).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Seg<'all' | Kind>
          value={kind}
          onChange={(v) => { setKind(v); setPage(1) }}
          items={[
            { k: 'all', label: A('al.type.all') },
            { k: 'account', label: A('al.type.account') },
            { k: 'advisory', label: A('al.type.advisory') },
            { k: 'catch', label: A('al.type.catch') },
          ]}
        />
        <Pick icon={CalendarDays} value={range} onChange={(v) => { setRange(v); setPage(1) }} label={A('c.r.all')}>
          <option value="all">{A('c.r.all')}</option>
          <option value="7">{A('c.r.7')}</option>
          <option value="30">{A('c.r.30')}</option>
        </Pick>
        <label className="relative min-w-52 flex-1">
          <Search size={18} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={A('c.search')} aria-label={A('c.search')} className={`${inputCls} !min-h-12 pl-10`} />
        </label>
      </div>

      <Panel flush>
        {rows.length === 0 ? (
          loading ? <p className="p-6 text-ink-soft">{A('c.loading')}</p> : <Empty icon={Info} text={A('al.empty')} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((e) => {
              const I = ICON[e.kind]
              return (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-seafoam text-teal"><I size={20} strokeWidth={1.8} /></span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] leading-tight">{e.title}</b>
                    <p className="truncate text-sm text-ink-soft">{e.sub}</p>
                  </div>
                  <time className="hidden shrink-0 text-xs text-ink-soft sm:block">{when(e.at)}</time>
                  <time className="shrink-0 text-xs text-ink-soft sm:hidden">{new Date(e.at).toLocaleDateString(loc, { month: 'short', day: 'numeric' })}</time>
                </li>
              )
            })}
          </ul>
        )}
        <Pager page={cur} pages={pages} onPage={setPage} prev={A('c.prev')} next={A('c.next')}
          info={A('c.showing', { from, to: from === 0 ? 0 : from + rows.length - 1, total: shown.length })} />
      </Panel>

      {partial && <p className="flex items-center gap-2 px-1 text-xs text-risk-high"><Info size={14} aria-hidden className="shrink-0" />{A('al.partial')}</p>}
      <p className="flex items-center gap-2 px-1 text-xs text-ink-soft"><Info size={14} aria-hidden className="shrink-0" />{A('al.note')}</p>
    </div>
  )
}