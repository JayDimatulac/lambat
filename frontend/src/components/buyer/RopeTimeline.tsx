import { useBT, type BKey } from '../../lib/buyerText'
import type { OrderStatus } from '../../lib/market'

const STEPS: { key: BKey; at: OrderStatus[] }[] = [
  { key: 'step.confirmed', at: ['confirmed'] },
  { key: 'step.onway', at: ['onway'] },
  { key: 'step.received', at: ['received'] },
]

/* A rope with three knots. A knot is tied (filled) once that step is done. */
export default function RopeTimeline({ status }: { status: OrderStatus }) {
  const b = useBT()
  const idx = status === 'received' ? 2 : status === 'onway' ? 1 : status === 'confirmed' ? 0 : -1
  return (
    <ol className="relative flex justify-between" aria-label={b('orders.title')}>
      <span className="absolute left-4 right-4 top-[15px] h-0.5" style={{ background: 'repeating-linear-gradient(90deg, var(--color-line) 0 8px, transparent 8px 12px)' }} aria-hidden="true" />
      <span className="absolute left-4 top-[15px] h-0.5 bg-teal transition-all" style={{ width: `${Math.max(0, idx) * 50}%`, maxWidth: 'calc(100% - 2rem)' }} aria-hidden="true" />
      {STEPS.map((s, i) => {
        const done = i <= idx
        return (
          <li key={s.key} className="relative z-10 flex w-20 flex-col items-center gap-1 text-center">
            <span className={`grid size-8 place-items-center rounded-full border-2 transition ${done ? 'border-teal bg-teal text-on-accent' : 'border-line bg-card'} ${i === idx ? 'anim-pop ring-4 ring-seafoam' : ''}`}>
              {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.6L10 17.4L19 7" /></svg>}
            </span>
            <span className={`text-xs font-semibold leading-tight ${done ? 'text-navy' : 'text-ink-soft'}`}>{b(s.key)}</span>
          </li>
        )
      })}
    </ol>
  )
}