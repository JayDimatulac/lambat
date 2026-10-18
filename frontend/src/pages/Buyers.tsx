import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Radar from '../components/buyers/Radar'
import PartyCard from '../components/buyers/PartyCard'
import Chip from '../components/ui/Chip'
import Disclaimer from '../components/ui/Disclaimer'
import Segmented from '../components/ui/Segmented'
import { BangkaIcon } from '../components/home/HomeIcons'
import { PierIcon, RowsIcon } from '../components/icons'
import { byUrgency, isActive } from '../data/mock'
import { useCatches } from '../data/store'
import { matchesFor, type Kind } from '../lib/buyers'
import { countdownText, sellByText } from '../lib/time'
import { useT } from '../lib/i18n'
import { useSettings } from '../lib/settings'

type View = 'radar' | 'list'

export default function Buyers() {
  const t = useT()
  const { lang } = useSettings()
  const { catches } = useCatches()
  const [params, setParams] = useSearchParams()
  const [kind, setKind] = useState<Kind>('buyer')
  const [view, setView] = useState<View>('radar')
  const [picked, setPicked] = useState<string | null>(null)
  const [offered, setOffered] = useState<Set<string>>(new Set())

  const active = catches.filter(isActive).sort(byUrgency)
  const c = active.find((x) => x.id === params.get('catch')) ?? active[0]
  const matches = useMemo(() => (c ? matchesFor(c, kind) : []), [c, kind])

  if (!c) {
    return (
      <div className="space-y-3">
        <h2 className="text-[28px]">{t('nav.buyers')}</h2>
        <p className="rounded-md border border-dashed border-line bg-card p-8 text-center text-ink-soft">{t('buyers.empty')}</p>
      </div>
    )
  }

  const selectedId = matches.some((m) => m.party.id === picked) ? picked : (matches[0]?.party.id ?? null)
  const selected = matches.find((m) => m.party.id === selectedId)
  const reachable = matches.filter((m) => m.reachable).length
  const accent = kind === 'buyer' ? '#0f6e7a' : '#e8735a'
  const offer = (id: string) => setOffered((s) => new Set(s).add(`${c.id}:${id}`))
  const isOffered = (id: string) => offered.has(`${c.id}:${id}`)

  const radar = (
    <section className="overflow-hidden rounded-lg shadow-raised" style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sea-2))' }}>
      <div className="flex items-center justify-between px-4 pt-3 text-white">
        <h2 className="font-numeral text-lg font-bold text-white">{t('buyers.radar')}</h2>
        <span className="rounded-full bg-deep/50 px-2.5 py-0.5 text-xs font-semibold text-white">{t('ui.sample')}</span>
      </div>
      <div className="px-2 pb-1 pt-1">
        <Radar
          matches={matches}
          selectedId={selectedId}
          onSelect={setPicked}
          accent={accent}
          label={(m) => `${m.party.name}, ${m.party.km} km, ${m.reachable ? t('radar.reach') : t('radar.noreach')}`}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-4 text-xs font-semibold text-white">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-cream" style={{ background: accent }} />{t('radar.reach')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-dashed border-white/70" />{t('radar.noreach')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-coral" />{t('buyers.best')}</span>
      </div>
    </section>
  )

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">{t('va.pick')}</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {active.map((x) => (
              <Chip key={x.id} active={x.id === c.id} onClick={() => setParams({ catch: x.id })} className="shrink-0">{x.species} · {x.kg} kg</Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-seafoam p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-teal"><BangkaIcon size={28} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-numeral text-lg font-bold leading-tight">{c.species} · {c.kg} kg</p>
            <p className="text-sm">{c.minsMin > 0 ? `${t('detail.timeleft')}: ${countdownText(c.minsMin)} · ${sellByText(c.hoursMin, lang, t)}` : t('detail.timesup')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Segmented<Kind>
            label={t('nav.buyers')}
            value={kind}
            onChange={(k) => { setKind(k); setPicked(null) }}
            options={[
              { value: 'buyer', label: <><PierIcon size={20} />{t('nav.buyers')}</> },
              { value: 'share', label: t('strand.share') },
            ]}
          />
          <Segmented<View>
            label={t('buyers.radar')}
            value={view}
            onChange={setView}
            options={[
              { value: 'radar', label: t('view.radar') },
              { value: 'list', label: <><RowsIcon size={20} />{t('view.list')}</> },
            ]}
          />
        </div>

        <p className="text-sm font-semibold text-ink-soft">{t('buyers.summary', { n: reachable })}</p>
        {view === 'radar' && radar}
      </div>

      <div className="space-y-4">
        {view === 'radar' && selected ? (
          <PartyCard m={selected} kg={c.kg} best={selected.party.id === matches.find((m) => m.reachable)?.party.id} selected offered={isOffered(selected.party.id)} onOffer={() => offer(selected.party.id)} />
        ) : (
          matches.map((m, i) => (
            <PartyCard key={m.party.id} m={m} kg={c.kg} best={i === 0 && m.reachable} offered={isOffered(m.party.id)} onOffer={() => offer(m.party.id)} />
          ))
        )}
        {view === 'radar' && (
          <Link to={`/catches/${c.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-teal px-4 text-sm font-semibold text-teal">
            {t('va.see')}
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        )}
        <Disclaimer>{t('buyers.note')}</Disclaimer>
      </div>
    </div>
  )
}