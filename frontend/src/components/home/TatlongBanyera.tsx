import { useT } from '../../lib/i18n'

type Share = { n: number; kg: number }
type Kind = 'sold' | 'shared' | 'lost'

// Phone weekly summary: three tubs (banyera) on a low wooden dock. An empty tub means 0 kg.
const TUBS: { kind: Kind; body: string; rim: string; fish: string }[] = [
  { kind: 'sold', body: '#2f7fc4', rim: '#8cc4f0', fish: '#cfe6fa' },
  { kind: 'shared', body: '#2e8a4f', rim: '#8fd6a6', fish: '#d3f0dc' },
  { kind: 'lost', body: '#c4472f', rim: '#f0a191', fish: '#f7d3ca' },
]

function Tub({ body, rim, fish, level }: { body: string; rim: string; fish: string; level: number }) {
  // level: 0 = empty, otherwise how full the tub looks (0.35 to 1)
  const rise = level > 0 ? 3 + level * 6 : 0
  return (
    <svg viewBox="0 0 100 64" className="block w-[68px]" aria-hidden="true">
      <path d="M6 20 L94 20 L84 56 Q50 63 16 56 Z" fill={body} />
      <path d="M12 38 Q50 46 88 38 L86 46 Q50 54 14 46 Z" fill="#000" fillOpacity="0.12" />
      <ellipse cx="50" cy="20" rx="44" ry="12" fill={rim} />
      <ellipse cx="50" cy="21" rx="38" ry="9" fill="#0b2530" />
      {level > 0 && (
        <>
          <ellipse cx="50" cy={22 - rise / 2} rx="34" ry={4 + rise / 2} fill={fish} fillOpacity="0.92" />
          <ellipse cx="42" cy={20 - rise / 2} rx="9" ry="2.4" fill="#fff" fillOpacity="0.5" />
        </>
      )}
    </svg>
  )
}

export default function TatlongBanyera({ sold, shared, lost }: { sold: Share; shared: Share; lost: Share }) {
  const t = useT()
  const shares: Record<Kind, Share> = { sold, shared, lost }
  const total = Math.round(sold.kg + shared.kg + lost.kg)
  const max = Math.max(1, sold.kg, shared.kg, lost.kg)

  return (
    <section aria-labelledby="home-week" className="space-y-1.5 lg:hidden">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="home-week" className="font-display text-lg font-bold">{t('home.week.catch')}</h2>
        <span className="text-sm font-medium text-ink-soft">{total} kg</span>
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-line"
        style={{
          background:
            'linear-gradient(180deg, transparent 0 78%, rgba(0,0,0,0.14) 78% 79.5%, transparent 79.5%), linear-gradient(180deg, #12566d 0 38%, #5c4631 38% 100%)',
        }}
      >
        <ul className="grid grid-cols-3 px-2 pb-2 pt-3">
          {TUBS.map(({ kind, body, rim, fish }) => {
            const kg = Math.round(shares[kind].kg)
            const level = shares[kind].kg > 0 ? Math.max(0.35, shares[kind].kg / max) : 0
            return (
              <li key={kind} className="flex min-w-0 flex-col items-center">
                <Tub body={body} rim={rim} fish={fish} level={level} />
                <span className="mt-0.5 max-w-full truncate text-xs font-medium text-white/95">{t(`tally.${kind}`)}</span>
                <span className="text-[13px] font-semibold leading-tight text-white">{kg} kg</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
