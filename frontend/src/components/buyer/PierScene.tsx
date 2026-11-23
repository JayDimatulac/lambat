import type { ReactNode } from 'react'
import Boat from './Boat'
import { RISK, type RiskLevel } from '../../lib/risk'
import { useSettings } from '../../lib/settings'
import dayImg from '../../assets/bg/pier-day.webp'
import nightImg from '../../assets/bg/pier-night.webp'

/* The pantalan: day or night scene. Each boat coming in is a lot of fish for sale, and its lantern shows how soon it must be sold. */
export default function PierScene({ lots, header }: { lots: { id: string; risk: RiskLevel }[]; header: ReactNode }) {
  const { theme } = useSettings()
  const night = theme === 'night'
  const boats = lots.slice(0, 4)
  // If the image file is missing, the gradient shows instead
  const fallback = night
    ? 'linear-gradient(180deg, #05171e, #0a2f3c 55%, #0d525e)'
    : 'linear-gradient(180deg, #8fd3e3, #d6eff1 55%, #3a9bab)'

  return (
    <section className="relative aspect-[2/1] min-h-[200px] overflow-hidden rounded-lg shadow-raised" style={{ background: fallback }}>
      <img src={night ? nightImg : dayImg} alt="" className="absolute inset-0 size-full object-cover" />

      {/* a soft shade at the top so the white greeting is easy to read */}
      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black/40 to-transparent" aria-hidden="true" />

      {/* the lot boats, placed in the picture's own pixels (1774 x 887) so they line up with the sea */}
      <svg viewBox="0 0 1774 887" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
        {boats.map((b, i) => (
          <g key={b.id} transform={`translate(${330 + i * 230} ${735 + (i % 2) * 55}) scale(1.5)`}>
            <g className="anim-rock" style={{ transformOrigin: '0px 10px', animationDelay: `${i * 0.5}s` }}>
              <Boat lamp={RISK[b.risk].fill} />
            </g>
          </g>
        ))}
      </svg>

      <div className="relative z-10 px-4 pt-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]">{header}</div>
    </section>
  )
}