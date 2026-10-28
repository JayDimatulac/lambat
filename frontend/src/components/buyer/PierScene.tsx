import type { ReactNode } from 'react'
import Boat from './Boat'
import { RISK, type RiskLevel } from '../../lib/risk'

const WAVES = 'M0 118q15-6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0'

/* The pantalan at dusk. Each boat coming in is a lot of fish for sale: its lantern shows how soon it must be sold. */
export default function PierScene({ lots, header }: { lots: { id: string; risk: RiskLevel }[]; header: ReactNode }) {
  const boats = lots.slice(0, 4)
  return (
    <section className="relative overflow-hidden rounded-lg shadow-raised" style={{ background: 'linear-gradient(180deg, var(--tide-sky-0), var(--tide-sky-1) 55%, var(--tide-sky-2))' }}>
      <div className="relative z-10 px-4 pt-3">{header}</div>
      <svg viewBox="0 0 360 150" className="-mt-2 block w-full" aria-hidden="true">
        <circle cx="300" cy="22" r="11" style={{ fill: 'var(--tide-sun)' }} />
        <circle cx="300" cy="22" r="26" style={{ fill: 'var(--tide-sun-glow)' }} />
        {[[40, 18], [90, 34], [150, 12], [210, 30]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" className="anim-twinkle" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
        <rect x="0" y="104" width="360" height="46" style={{ fill: 'var(--tide-sea-1)' }} />

        {/* the pier */}
        <g stroke="var(--color-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M262 112V78M292 112V78M322 112V78M352 112V78" fill="none" />
          <rect x="250" y="70" width="110" height="9" rx="2" style={{ fill: 'var(--color-cream)' }} />
          <path d="M262 70V46M262 46H274" fill="none" />
          <circle cx="278" cy="46" r="5" style={{ fill: 'var(--color-coral)' }} className="anim-glow" />
        </g>

        <g className="anim-drift"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" /></g>

        {boats.map((b, i) => (
          <g key={b.id} transform={`translate(${52 + i * 62} ${96 - (i % 2) * 6}) scale(0.5)`}>
            <g className="anim-rock" style={{ transformOrigin: '0px 10px', animationDelay: `${i * 0.5}s` }}>
              <Boat lamp={RISK[b.risk].fill} />
            </g>
          </g>
        ))}
        <g className="anim-drift-rev" transform="translate(0 8)"><path d={WAVES} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" /></g>
      </svg>
    </section>
  )
}