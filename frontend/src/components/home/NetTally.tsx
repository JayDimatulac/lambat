import { LostFishIcon, SharedFishIcon, SoldFishIcon } from './HomeIcons'
import { useT } from '../../lib/i18n'

// The week as a lambat (net). Every mesh holds a share of the catch. A mesh with a tear is a share that was lost.
const COLS = 10
const ROWS = 5
const CELLS = COLS * ROWS
const CELL_W = 30

type Share = { n: number; kg: number }
type Kind = 'sold' | 'shared' | 'lost'

function Diamond({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <polygon
        points="10,1 19,10 10,19 1,10"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeDasharray={kind === 'lost' ? '3 3' : undefined}
        style={{
          fill: kind === 'sold' ? 'var(--color-teal)' : kind === 'shared' ? 'var(--color-coral)' : 'var(--color-mint)',
          fillOpacity: kind === 'lost' ? 1 : 0.8,
          stroke: kind === 'lost' ? 'var(--color-ink-soft)' : 'var(--color-deep)',
        }}
      />
    </svg>
  )
}

export default function NetTally({ sold, shared, lost }: { sold: Share; shared: Share; lost: Share }) {
  const t = useT()
  const total = Math.max(1, sold.kg + shared.kg + lost.kg)
  const pct = Math.round(((sold.kg + shared.kg) / total) * 100)

  // how many meshes each share gets (a share that exists always gets at least one)
  const nLost = lost.kg > 0 ? Math.max(1, Math.round((CELLS * lost.kg) / total)) : 0
  const nShared = shared.kg > 0 ? Math.max(1, Math.round((CELLS * shared.kg) / total)) : 0
  const nSold = Math.max(0, CELLS - nLost - nShared)
  const kinds: Kind[] = Array.from({ length: CELLS }, (_, i) => (i < nSold ? 'sold' : i < nSold + nShared ? 'shared' : 'lost'))

  const cell = (i: number) => {
    const row = Math.floor(i / COLS)
    const cx = 15 + (i % COLS) * CELL_W + (row % 2 ? 15 : 0)
    const cy = 14 + row * 14
    return { cx, cy, points: `${cx},${cy - 14} ${cx + 15},${cy} ${cx},${cy + 14} ${cx - 15},${cy}` }
  }

  const legend = [
    { kind: 'sold' as const, share: sold, Icon: SoldFishIcon, color: 'text-teal' },
    { kind: 'shared' as const, share: shared, Icon: SharedFishIcon, color: 'text-coral' },
    { kind: 'lost' as const, share: lost, Icon: LostFishIcon, color: 'text-ink-soft' },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-card p-5 shadow-rest">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{t('home.week')}</p>
      <div className="mt-2 flex items-end gap-4">
        <p className="font-numeral text-[72px] font-extrabold leading-[0.8] text-teal">
          {pct}
          <span className="text-3xl">%</span>
        </p>
        <p className="pb-1 text-sm font-medium leading-snug">{t('tally.summary', { pct })}</p>
      </div>

      <svg viewBox="0 0 315 84" className="mt-5 block w-full" role="img" aria-label={t('tally.summary', { pct })}>
        {kinds.map((kind, i) => {
          const { points } = cell(i)
          return kind === 'lost' ? (
            <polygon key={i} points={points} strokeWidth="1.6" strokeDasharray="3 3" style={{ fill: 'var(--color-mint)', stroke: 'var(--color-ink-soft)' }} />
          ) : (
            <polygon
              key={i}
              points={points}
              strokeWidth="1.6"
              strokeLinejoin="round"
              style={{ fill: kind === 'sold' ? 'var(--color-teal)' : 'var(--color-coral)', fillOpacity: 0.78, stroke: 'var(--color-deep)', strokeOpacity: 0.55 }}
            />
          )
        })}
        {kinds.map((kind, i) => {
          if (kind === 'lost') return null
          const { cx, cy } = cell(i)
          return <circle key={`k${i}`} cx={cx} cy={cy - 14} r="2" strokeWidth="1" style={{ fill: 'var(--color-cream)', stroke: 'var(--color-deep)', strokeOpacity: 0.6 }} />
        })}
      </svg>

      <ul className="mt-5 grid grid-cols-3 gap-2">
        {legend.map(({ kind, share, Icon, color }) => (
          <li key={kind} className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Diamond kind={kind} />
              <span className="truncate text-xs font-bold">{t(`tally.${kind}`)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Icon size={30} className={color} />
              <div>
                <p className="font-numeral text-3xl font-extrabold leading-none">{share.n}</p>
                <p className="mt-0.5 text-xs font-medium text-ink-soft">{Math.round(share.kg)} kg</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}