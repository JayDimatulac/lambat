import { useEffect, useRef, useState, type CSSProperties } from 'react'
import dayImg from '../../assets/bg/parola-day.png'
import nightImg from '../../assets/bg/parola-night.png'

// All coordinates below are in the picture's own pixels (1672 x 941), so the SVG always lines up with the art.
const W = 1672
const LAMP = { x: 1478, y: 188 }
const WAVELENGTH = 209
const WAVE = 'M0 0q52.25 -14 104.5 0' + ' t104.5 0'.repeat(19) // 20 half-waves = 10 wavelengths, wider than the picture

// Day gulls: y in the sky, flight time (12-18s), start offset, size, and where they rest if motion is reduced
const BIRDS = [
  { y: 150, dur: 16, delay: -3, s: 1, rest: 420 },
  { y: 255, dur: 13, delay: -9, s: 0.75, rest: 900 },
  { y: 95, dur: 18, delay: -14, s: 0.6, rest: 1180 },
]

type Props = { night: boolean; alert: boolean }

export default function ParolaStage({ night, alert }: Props) {
  // Tapping or hovering a gull startles it: it flaps fast and darts up, then settles back into its flight
  const [startled, setStartled] = useState<boolean[]>(() => BIRDS.map(() => false))
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const startle = (i: number) => {
    if (startled[i]) return
    setStartled((s) => s.map((v, k) => (k === i ? true : v)))
    timers.current.push(
      window.setTimeout(() => setStartled((s) => s.map((v, k) => (k === i ? false : v))), 1600),
    )
  }

  const glow = alert ? 'var(--color-coral)' : 'var(--color-cream)'

  return (
    <div
      aria-hidden="true"
      className="relative aspect-[16/8] shrink-0 overflow-hidden"
      style={{ maskImage: 'linear-gradient(to bottom, #000 78%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent)' }}
    >
      {/* the art and everything animated on it scale together, so the night picture's baked-in corners are cropped away */}
      <div className="absolute inset-0 origin-top scale-[1.04]">
        <img src={night ? nightImg : dayImg} alt="" draggable={false} className="size-full object-cover" />

        <svg viewBox={`0 0 ${W} 941`} preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full">
          <defs>
            <radialGradient id="stage-glow">
              <stop offset="0" style={{ stopColor: glow }} stopOpacity="0.85" />
              <stop offset="1" style={{ stopColor: glow }} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="stage-beam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="900" y2="0">
              <stop offset="0" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0.5" />
              <stop offset="1" style={{ stopColor: 'var(--color-cream)' }} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* waves drifting over the water, 6 and 8 seconds per wavelength */}
          <g className="stage-wave" style={{ '--wl': `${WAVELENGTH}px`, animationDuration: '8s' } as CSSProperties}>
            <path d={WAVE} transform="translate(0 770)" fill="none" stroke="#fff" strokeOpacity={night ? 0.2 : 0.35} strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="stage-wave" style={{ '--wl': `${WAVELENGTH}px`, animationDuration: '6s' } as CSSProperties}>
            <path d={WAVE} transform="translate(-60 835)" fill="none" stroke="#fff" strokeOpacity={night ? 0.14 : 0.25} strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* lighthouse lamp: a soft pulse, turning coral when something needs you */}
          {(night || alert) && (
            <circle cx={LAMP.x} cy={LAMP.y} r="95" fill="url(#stage-glow)" className="anim-glow" />
          )}
          {night && (
            <g transform={`translate(${LAMP.x} ${LAMP.y})`}>
              <g className="stage-beam">
                <polygon points="0,-16 -900,-95 -900,75 0,16" fill="url(#stage-beam)" transform="scale(-1 1)" />
              </g>
            </g>
          )}

          {/* gulls (day only) */}
          {!night &&
            BIRDS.map((b, i) => (
              <g key={i} transform={`translate(0 ${b.y}) scale(${b.s})`}>
                <g
                  className="stage-bird-fly"
                  style={{ '--rest': `${b.rest}px`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` } as CSSProperties}
                >
                  <g className="stage-bird-bob" style={{ animationDelay: `${i * -1.3}s` }}>
                    <g className={startled[i] ? 'stage-bird-dart' : undefined}>
                      <g
                        className={startled[i] ? 'stage-bird-flap stage-bird-flap-fast' : 'stage-bird-flap'}
                        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animationDelay: `${i * -0.4}s` }}
                      >
                        <path
                          d="M-48 0Q-24 -38 0 0Q24 -38 48 0"
                          fill="none"
                          stroke="var(--color-deep)"
                          strokeOpacity="0.8"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      {/* generous invisible hit area, the only part of the scene that takes pointer events */}
                      <circle
                        r="80"
                        cy="-12"
                        fill="transparent"
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        onPointerEnter={() => startle(i)}
                        onClick={() => startle(i)}
                      />
                    </g>
                  </g>
                </g>
              </g>
            ))}
        </svg>
      </div>
    </div>
  )
}