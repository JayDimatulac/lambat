import { useId, type CSSProperties } from 'react'
import type { Sky } from '../../lib/weather'

// Everything here is drawn in the picture's own pixels (1677 x 938), on top of the background and under the text.
// The picture never changes; these layers are what the forecast moves: clouds, wind, rain, waves, whitecaps.
const W = 1677
const H = 938
const HORIZON = 562
const SUN = { x: 1368, y: 270 }
const MOON = { x: 1373, y: 223 }
const LANTERN = { x: 193, y: 676 }

type Props = { night: boolean; sky: Sky; wind: number; wave: number; rain: number; windDir?: number }

// Wind: same breakpoints as the sail advice (30 = caution, 41 = danger). Sea: from the wave height in metres.
const windLevel = (kmh: number) => (kmh >= 41 ? 3 : kmh >= 30 ? 2 : kmh >= 15 ? 1 : 0)
const seaLevel = (m: number) => (m >= 2.5 ? 3 : m >= 1.5 ? 2 : m >= 0.6 ? 1 : 0)

const CLOUD_COUNT: Record<Sky, number> = { sun: 0, partly: 2, cloud: 4, rain: 5 }
const STREAKS = [4, 8, 12]
const STREAK_SECS = [0, 9, 6, 4]
const CAPS = [0, 4, 9, 14]
const WAVE_SECS = [16, 12, 8, 5]
const WAVE_AMP = [5, 9, 15, 22]
const FLICKER_SECS = [3.4, 2.6, 1.6, 1]

const WL = 300
const waveD = (amp: number) => `M0 0q${WL / 4} ${-amp} ${WL / 2} 0` + ` t${WL / 2} 0`.repeat(13)

// Where each drifting cloud sits (y, size), spread over the sky
const CLOUD_SPOTS: [number, number][] = [[110, 3.2], [250, 2.4], [60, 2.8], [330, 3.6], [190, 2.1]]

export default function WeatherLayers({ night, sky, wind, wave, rain, windDir }: Props) {
  const uid = useId().replace(/:/g, '')
  const wl = windLevel(wind)
  const sl = seaLevel(wave)
  const raining = sky === 'rain'

  // The way the wind blows TOWARD (wind direction is where it comes from). Right is +1, left is -1.
  const toward = windDir === undefined ? 1 : Math.sin(((windDir + 180) * Math.PI) / 180) >= 0 ? 1 : -1
  const flip = toward < 0 ? `translate(${W} 0) scale(-1 1)` : undefined

  const cloudFill = raining ? (night ? '#3d5290' : '#8ea3b6') : night ? '#6b86c9' : '#ffffff'
  const cloudOp = raining ? 0.6 : night ? 0.45 : 0.6
  const cloudSecs = Math.max(80, 240 - wind * 4)
  const dim = { sun: 0, partly: 0.05, cloud: night ? 0.16 : 0.2, rain: night ? 0.3 : 0.36 }[sky]
  const dimColor = night ? '#000a22' : '#5b7085'
  const line = night ? 0.24 : 0.34
  const streak = night ? 0.4 : 0.6

  // Rain: two tiles of short slanted drops. Moving a tile down by its own height loops without a seam.
  const slant = toward * Math.min(34, 8 + wind * 0.6)
  const rainOp = 0.5 + rain / 250
  const tiles = [
    { w: 160, h: 200, sw: 2, op: 0.35 * rainOp, secs: 1.1 },
    { w: 230, h: 270, sw: 3, op: 0.5 * rainOp, secs: 0.8 },
  ]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <radialGradient id={`${uid}-sun`}>
          <stop offset="0" stopColor={night ? '#dfeaff' : '#ffe07a'} stopOpacity={night ? 0.3 : 0.5} />
          <stop offset="1" stopColor={night ? '#dfeaff' : '#ffe07a'} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-lamp`}>
          <stop offset="0" stopColor="#ffc15a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffc15a" stopOpacity="0" />
        </radialGradient>
        {tiles.map((tile, k) => (
          <pattern key={k} id={`${uid}-rain${k}`} width={tile.w} height={tile.h} patternUnits="userSpaceOnUse">
            {[0.25, 0.5, 0.78].map((fx, j) => (
              <line key={j} x1={tile.w * fx} y1={tile.h * (0.1 + j * 0.28)} x2={tile.w * fx + slant * 0.8} y2={tile.h * (0.1 + j * 0.28) + 52} stroke="#fff" strokeWidth={tile.sw} strokeLinecap="round" />
            ))}
          </pattern>
        ))}
      </defs>

      {/* sun or moon, breathing; hidden behind cloud when the sky is covered */}
      {(sky === 'sun' || sky === 'partly') && (
        <circle cx={night ? MOON.x : SUN.x} cy={night ? MOON.y : SUN.y} r="190" fill={`url(#${uid}-sun)`} className="anim-glow" />
      )}

      {/* clouds drifting with the wind: more of them, and faster, as the sky fills and the wind rises */}
      <g transform={flip}>
        {CLOUD_SPOTS.slice(0, CLOUD_COUNT[sky]).map(([y, s], i) => (
          <g key={i} transform={`translate(0 ${y})`}>
            <g
              className="wx-cross"
              style={{ '--rest': `${300 + i * 330}px`, animationDuration: `${cloudSecs}s`, animationDelay: `${-(i * cloudSecs) / 5}s` } as CSSProperties}
            >
              <g transform={`scale(${s})`} fill={cloudFill} fillOpacity={cloudOp}>
                <ellipse cx="0" cy="0" rx="90" ry="26" />
                <circle cx="-40" cy="-18" r="28" />
                <circle cx="10" cy="-34" r="38" />
                <circle cx="62" cy="-14" r="24" />
              </g>
            </g>
          </g>
        ))}
      </g>

      {/* an overcast sky dims the picture's own sun and clouds */}
      {dim > 0 && <rect x="0" y="0" width={W} height={HORIZON} fill={dimColor} fillOpacity={dim} />}

      {/* WIND: long streaks blowing through, more and faster as it picks up. None when it is calm. */}
      {wl > 0 && (
        <g transform={flip}>
          {Array.from({ length: STREAKS[wl - 1] }, (_, i) => {
            const y = 90 + ((i * 211) % 620)
            const len = 160 + ((i * 53) % 170)
            return (
              <g key={i} transform={`translate(0 ${y})`}>
                <g className="wx-streak" style={{ animationDuration: `${STREAK_SECS[wl] + (i % 3) * 0.8}s`, animationDelay: `${-i * 0.9}s` } as CSSProperties}>
                  <path d={`M0 0C${len * 0.33} -10 ${len * 0.66} 10 ${len} 0`} fill="none" stroke="#fff" strokeOpacity={streak} strokeWidth="3.5" strokeLinecap="round" />
                  <path d={`M${len * 0.2} 14C${len * 0.45} 8 ${len * 0.7} 20 ${len * 0.9} 14`} fill="none" stroke="#fff" strokeOpacity={streak * 0.6} strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </g>
            )
          })}
        </g>
      )}

      {/* waves on the sea: taller and quicker as the waves grow */}
      {[620, 685, 745].map((y, i) => (
        <g key={y} transform={`translate(${-20 * i} ${y})`}>
          <g className="stage-wave" style={{ '--wl': `${WL}px`, animationDuration: `${WAVE_SECS[sl] + i * 1.5}s` } as CSSProperties}>
            <path d={waveD(WAVE_AMP[sl])} fill="none" stroke="#fff" strokeOpacity={line} strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      ))}

      {/* whitecaps flashing on the water once the sea is up */}
      {Array.from({ length: CAPS[sl] }, (_, i) => (
        <ellipse
          key={i}
          cx={80 + ((i * 263) % 1500)}
          cy={600 + ((i * 97) % 150)}
          rx="16"
          ry="3.5"
          fill="#fff"
          fillOpacity="0.85"
          className="wx-cap"
          style={{ animationDelay: `${i * 0.37}s` } as CSSProperties}
        />
      ))}

      {/* the lantern's flame: steady in calm weather, nervous in the wind */}
      <circle
        cx={LANTERN.x}
        cy={LANTERN.y}
        r="95"
        fill={`url(#${uid}-lamp)`}
        className="wx-flicker"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%', animationDuration: `${FLICKER_SECS[wl]}s` }}
      />

      {/* RAIN, in front of everything */}
      {raining &&
        tiles.map((tile, k) => (
          <g key={k} className="wx-rain" style={{ '--tile': `${tile.h}px`, animationDuration: `${tile.secs}s` } as CSSProperties}>
            <rect x="-300" y={-tile.h} width={W + 600} height={H + tile.h} fill={`url(#${uid}-rain${k})`} fillOpacity={Math.min(1, tile.op * 1.6)} />
          </g>
        ))}
    </svg>
  )
}