import { useState } from 'react'
import { BuoyIcon, RowsIcon, TrayIcon } from '../components/icons'
import TideScene from '../components/tide/TideScene'
import { ListView, TrayView } from '../components/catch/views'
import Chip from '../components/ui/Chip'
import Segmented from '../components/ui/Segmented'
import { byUrgency, catches, isActive } from '../data/mock'
import { useT } from '../lib/i18n'

type View = 'tide' | 'tray' | 'list'
type Filter = 'all' | 'active' | 'sold' | 'shared'

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
  const [view, setViewState] = useState<View>(readView)
  const [filter, setFilter] = useState<Filter>('all')

  const setView = (v: View) => {
    setViewState(v)
    try { localStorage.setItem('lambat.view', v) } catch { /* storage can be blocked */ }
  }

  const sorted = [...catches].sort((a, b) => Number(!isActive(a)) - Number(!isActive(b)) || byUrgency(a, b))
  const shown = sorted.filter((c) =>
    filter === 'all' ? true : filter === 'active' ? isActive(c) : c.outcome === filter,
  )
  const active = catches.filter(isActive)
  const atRisk = active.filter((c) => c.risk === 'high' || c.risk === 'critical').length
  const kg = active.reduce((s, c) => s + c.kg, 0)
  const tideItems = shown.filter(isActive)

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t('filter.all') },
    { value: 'active', label: t('filter.active') },
    { value: 'sold', label: t('filter.sold') },
    { value: 'shared', label: t('filter.shared') },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[28px]">{t('catches.title')}</h2>
        <p className="simple-hide text-sm text-ink-soft">
          {t('catches.summary', { n: active.length, kg, risk: atRisk })}
        </p>
      </div>

      <Segmented<View>
        label={t('catches.title')}
        value={view}
        onChange={setView}
        className="w-full [&>button]:flex-1"
        options={[
          { value: 'tide', label: <><BuoyIcon size={20} />{t('view.tide')}</> },
          { value: 'tray', label: <><TrayIcon size={20} />{t('view.tray')}</> },
          { value: 'list', label: <><RowsIcon size={20} />{t('view.list')}</> },
        ]}
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <Chip key={f.value} active={f.value === filter} onClick={() => setFilter(f.value)} className="shrink-0">
            {f.label}
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('catches.empty')}</p>
      ) : view === 'tide' ? (
        tideItems.length > 0 ? <TideScene catches={tideItems} /> : <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('catches.tideonly')}</p>
      ) : view === 'tray' ? (
        <TrayView items={shown} />
      ) : (
        <ListView items={shown} />
      )}
    </div>
  )
}