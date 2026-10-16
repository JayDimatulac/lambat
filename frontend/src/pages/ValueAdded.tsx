import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import PathwayCard from '../components/detail/PathwayCard'
import Chip from '../components/ui/Chip'
import Disclaimer from '../components/ui/Disclaimer'
import RiskBadge from '../components/ui/RiskBadge'
import { byUrgency, isActive } from '../data/mock'
import { useCatches } from '../data/store'
import { pathwaysFor } from '../lib/pathways'
import { countdownText } from '../lib/time'
import { useT, type Key } from '../lib/i18n'
import { useSettings } from '../lib/settings'

// Why a catch has no pathway: one plain sentence for each reason
const WHY: Record<string, Key> = {
  'lock.value': 'va.locked.risk',
  'lock.value.ice': 'va.locked.ice',
  'lock.value.none': 'va.locked.none',
}

export default function ValueAdded() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const [params, setParams] = useSearchParams()

  const active = catches.filter(isActive).sort(byUrgency)
  const chosen = active.find((c) => c.id === params.get('catch')) ?? active.find((c) => pathwaysFor(c).available.length > 0) ?? active[0]
  const result = chosen ? pathwaysFor(chosen) : null

  return (
    <div className="space-y-5">
      <h2 className="text-[28px]">{t('nav.value')}</h2>

      {!chosen || !result ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('va.empty')}</p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink-soft">{t('va.pick')}</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {active.map((c) => (
                <Chip key={c.id} active={c.id === chosen.id} onClick={() => setParams({ catch: c.id })} className="shrink-0">
                  {c.species} · {c.kg} kg
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge level={chosen.risk} />
            <span className="font-semibold">{chosen.minsMin > 0 ? `${t('detail.timeleft')}: ${countdownText(chosen.minsMin)}` : t('detail.timesup')}</span>
          </div>

          {result.available.length > 0 ? (
            <>
              {lang === 'fil' && <p className="text-sm text-ink-soft">{t('va.englishnote')}</p>}
              <div className="space-y-4">
                {result.available.map((p) => <PathwayCard key={`${chosen.id}-${p.id}`} p={p} c={chosen} />)}
              </div>
            </>
          ) : (
            <section className="space-y-3 rounded-lg border border-dashed border-line bg-mint p-5">
              <span className="grid size-12 place-items-center rounded-full bg-seafoam text-teal"><Lock size={22} strokeWidth={1.8} aria-hidden /></span>
              <h3 className="text-xl">{result.reason ? t(result.reason) : ''}</h3>
              <p>{result.reason ? t(WHY[result.reason]) : ''}</p>
              <Link to={`/catches/${chosen.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-5 font-semibold text-deep">
                {t('va.see')}
                <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
              </Link>
            </section>
          )}
          <Disclaimer />
        </>
      )}
    </div>
  )
}