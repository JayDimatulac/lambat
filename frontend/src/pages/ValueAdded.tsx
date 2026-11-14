import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Lock } from 'lucide-react'
import FishShape from '../components/FishShape'
import PathwayCard from '../components/detail/PathwayCard'
import ProcessGuide from '../components/detail/ProcessGuide'
import { FishIcon } from '../components/icons'
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
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <h2 className="text-[26px] sm:text-[30px]">{t('nav.value')}</h2>

      {!chosen || !result ? (
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('va.empty')}</p>
      ) : (
        <>
          {/* Pick the catch, and see its condition, in one card */}
          <section className="space-y-4 rounded-lg border border-line bg-card p-4 shadow-rest sm:p-5">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-base font-bold">
                <FishIcon size={20} className="shrink-0 text-teal" />
                {t('va.pick')}
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                {active.map((c) => (
                  <Chip key={c.id} compact active={c.id === chosen.id} onClick={() => setParams({ catch: c.id })} className="inline-flex shrink-0 items-center gap-1.5">
                    {c.id === chosen.id && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
                    {c.species} · {c.kg} kg
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden rounded-md bg-gradient-to-r from-seafoam via-ice to-seafoam p-3 sm:p-4">
              <FishShape shape={chosen.shape} className="h-11 w-20 shrink-0 text-teal" />
              <span aria-hidden="true" className="hidden h-10 w-px bg-line sm:block" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-numeral text-lg font-bold leading-tight">{chosen.species} · {chosen.kg} kg</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <RiskBadge level={chosen.risk} />
                  <span className="text-sm font-semibold">{chosen.minsMin > 0 ? `${t('detail.timeleft')}: ${countdownText(chosen.minsMin)}` : t('detail.timesup')}</span>
                </div>
              </div>
              <Link to={`/catches/${chosen.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-teal bg-card px-4 text-sm font-semibold text-teal transition hover:bg-mint">
                {t('va.see')}
                <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {result.available.length > 0 ? (
            <>
              {lang === 'fil' && <p className="text-sm text-ink-soft">{t('va.englishnote')}</p>}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 md:items-start">
                {result.available.map((p) => (
                  <div key={`${chosen.id}-${p.id}`} className="space-y-3">
                    <PathwayCard p={p} c={chosen} />
                    {/* the server re-checks suitability and sends the verified guide */}
                    <ProcessGuide catchId={chosen.id} product={p.name} />
                  </div>
                ))}
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