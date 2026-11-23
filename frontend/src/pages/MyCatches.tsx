import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Waves } from 'lucide-react'
import { BuoyIcon, RowsIcon, TrayIcon } from '../components/icons'
import TideScene from '../components/tide/TideScene'
import { ListView, TrayView } from '../components/catch/views'
import Chip from '../components/ui/Chip'
import Segmented from '../components/ui/Segmented'
import { byUrgency, isActive, needsAttention } from '../data/mock'
import { useCatches } from '../data/store'
import { useT } from '../lib/i18n'

type View = 'tide' | 'tray' | 'list'
type Filter = 'all' | 'attention' | 'active' | 'sold' | 'shared'

const readView = (): View => {
  try {
    const v = localStorage.getItem('lambat.view')
    return v === 'tray' || v === 'list' ? v : 'tide'
  } catch {
    return 'tide'
  }
}

export default function MyCatches() {
  const t = useT()
  const { catches } = useCatches()
  const [view, setViewState] = useState<View>(readView)
  const [params, setParams] = useSearchParams()
  const raw = params.get('filter')
  const filter: Filter = raw === 'attention' || raw === 'active' || raw === 'sold' || raw === 'shared' ? raw : 'all'
  const setFilter = (f: Filter) => setParams(f === 'all' ? {} : { filter: f }, { replace: true })

  const setView = (v: View) => {
    setViewState(v)
    try { localStorage.setItem('lambat.view', v) } catch { /* storage can be blocked */ }
  }

  const sorted = [...catches].sort((a, b) => Number(!isActive(a)) - Number(!isActive(b)) || byUrgency(a, b))
  const shown = sorted.filter((c) =>
    filter === 'all' ? true : filter === 'active' ? isActive(c) : filter === 'attention' ? needsAttention(c) : c.outcome === filter,
  )
  const active = catches.filter(isActive)
  const atRisk = active.filter((c) => c.risk === 'high' || c.risk === 'critical').length
  const kg = active.reduce((s, c) => s + c.kg, 0)
  const tideItems = shown.filter(isActive)

  // Phones: the Tide shows only the two catches that need attention most (same as Home). The rest are in Bandeha and Listahan.
  const rank = (c: (typeof catches)[number]) => (c.risk === 'critical' ? 2 : c.risk === 'high' ? 1 : 0)
  const phoneTide = tideItems.filter(needsAttention).sort((a, b) => rank(b) - rank(a) || a.hoursMin - b.hoursMin).slice(0, 2)

  const countOf = (f: Filter) =>
    f === 'all' ? catches.length : f === 'active' ? active.length : f === 'attention' ? catches.filter(needsAttention).length : catches.filter((c) => c.outcome === f).length
  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t('filter.all') },
    ...(countOf('attention') > 0 || filter === 'attention' ? [{ value: 'attention' as Filter, label: t('filter.attention') }] : []),
    { value: 'active', label: t('filter.active') },
    { value: 'sold', label: t('filter.sold') },
    { value: 'shared', label: t('filter.shared') },
  ]

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4">
      {/* Header: title and summary, with a quiet bangka on the water */}
      <header className="relative overflow-hidden rounded-lg border border-line bg-gradient-to-br from-card via-card to-seafoam px-5 py-5 shadow-rest sm:px-6">
        <div className="relative z-10 space-y-1">
          <h2 className="text-[26px] leading-tight sm:text-[30px]">{t('catches.title')}</h2>
          <p className="simple-hide flex items-center gap-2 text-sm font-medium text-ink-soft">
            <Waves size={20} strokeWidth={1.8} className="shrink-0 text-teal" aria-hidden="true" />
            {t('catches.summary', { n: active.length, kg, risk: atRisk })}
          </p>
        </div>
      </header>

      <Segmented<View>
        label={t('catches.title')}
        value={view}
        onChange={setView}
        tone="coral"
        className="w-full [&>button]:flex-1"
        options={[
          { value: 'tide', label: <><BuoyIcon size={20} />{t('view.tide')}</> },
          { value: 'tray', label: <><TrayIcon size={20} />{t('view.tray')}</> },
          { value: 'list', label: <><RowsIcon size={20} />{t('view.list')}</> },
        ]}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <Chip key={f.value} compact active={f.value === filter} onClick={() => setFilter(f.value)} className="shrink-0">
            {f.label}
            <span className="ml-1.5 text-xs font-bold opacity-70">{countOf(f.value)}</span>
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('catches.empty')}</p>
      ) : view === 'tide' ? (
        tideItems.length > 0 ? (
          <>
            {/* phones: the two most urgent buoys, no swiping */}
            <div className="space-y-2 lg:hidden">
              <TideScene compact catches={phoneTide} emptyText={t('home.calm')} />
              {tideItems.length > phoneTide.length && (
                <button
                  type="button"
                  onClick={() => setView('tray')}
                  className="flex min-h-11 w-full items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-semibold text-teal"
                >
                  {t('home.seeall')} ({tideItems.length})
                </button>
              )}
            </div>
            {/* desktop: the full sea scene with every buoy */}
            <div className="hidden lg:block">
              <TideScene catches={tideItems} />
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('catches.tideonly')}</p>
        )
      ) : view === 'tray' ? (
        <TrayView items={shown} />
      ) : (
        <ListView items={shown} />
      )}
    </div>
  )
}