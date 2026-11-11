import { Minus, Plus } from 'lucide-react'
import type { Draft } from './steps'

const MAX_DIAL = 100
const MAX_KG = 500
const QUICK = [1, 5, 10, 25, 50, 100]

const PALE = '#9fc5cf'
const LABEL = '#cfe3e8'
const DARK = '#0a2f3b'
const CORAL = '#ee6c4d'

const CX = 100
const CY = 95
const R = 68
const SWEEP = 145

const BUCKET_SCALE = 1.3 // 1.2 = slightly bigger, 1.4 = bigger still

const angleOf = (kg: number) => -SWEEP + (Math.min(kg, MAX_DIAL) / MAX_DIAL) * SWEEP * 2

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) }
}

const LABELS = [0, 20, 40, 60, 80, 100]

const SLOTS: [number, number][] = [
  [100, 234], [84, 226], [118, 226], [96, 217], [76, 236],
  [124, 236], [70, 217], [130, 217], [100, 206], [82, 207],
]

const fishCount = (kg: number) => {
  if (kg <= 0) return 0
  if (kg <= 10) return 1
  if (kg <= 20) return 2
  if (kg <= 30) return 3
  if (kg <= 40) return 4
  if (kg <= 50) return 5
  if (kg <= 60) return 6
  if (kg <= 75) return 7
  if (kg <= 90) return 8
  if (kg < 100) return 9
  return 10
}

function Fish({ x, y, color, flip }: { x: number; y: number; color: string; flip: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -0.85 : 0.85} 0.85)`}>
      <ellipse cx="0" cy="0" rx="9" ry="4" fill={color} />
      <path d="M7 0 L14 -4 L14 4 Z" fill={color} />
      <circle cx="-4.5" cy="-1" r="0.9" fill={DARK} />
    </g>
  )
}

export function ScaleArt({ kg }: { kg: number }) {
  const n = fishCount(kg)
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5)
  const needleAngle = angleOf(kg)

  return (
    <svg viewBox="0 0 200 262" className="mx-auto h-63 w-auto" role="img" aria-label={`${kg} kg`}>
      <defs>
        <clipPath id="bucket-clip">
          <polygon points="56,192 144,192 130,238 70,238" />
        </clipPath>
      </defs>

      {/* Top ring */}
      <circle cx={CX} cy="12" r="6" fill="none" stroke={PALE} strokeWidth="3" />

      {/* Dial rim */}
      <circle cx={CX} cy={CY} r={R + 5} fill="rgba(159,197,207,0.07)" stroke={PALE} strokeWidth="6" />

      {/* Tick marks */}
      {ticks.map((v) => {
        const major = v % 20 === 0
        const a = angleOf(v)
        const p1 = polar(a, R - (major ? 12 : 7))
        const p2 = polar(a, R - 1)
        return (
          <line
            key={v}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={PALE}
            strokeWidth={major ? 2.8 : 1.2}
            strokeLinecap="round"
          />
        )
      })}

      {/* Numbers */}
      {LABELS.map((v) => {
        const p = polar(angleOf(v), R - 22)
        return (
          <text key={v} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill={LABEL}>
            {v === 100 ? '100+' : v}
          </text>
        )
      })}

      <text x={CX} y={CY + 18} textAnchor="middle" fontSize="6.5" fontWeight="800" fill={PALE}>
        KG
      </text>

      {/* Needle */}
      <g
        style={{
          transformOrigin: `${CX}px ${CY}px`,
          transform: `rotate(${needleAngle}deg)`,
          transition: 'transform 400ms cubic-bezier(0.3, 1.3, 0.5, 1)',
        }}
      >
        <line x1={CX} y1={CY} x2={CX} y2={CY - R + 18} stroke={PALE} strokeWidth="3" strokeLinecap="round" />
        <path d={`M${CX} ${CY - R + 12} L${CX - 5} ${CY - R + 26} L${CX + 5} ${CY - R + 26} Z`} fill={CORAL} />
      </g>

      {/* Center cap */}
      <circle cx={CX} cy={CY} r="5.5" fill={PALE} />
      <circle cx={CX} cy={CY} r="2" fill={CORAL} />

      {/* Rod */}
      <line x1={CX} y1={CY + R + 5} x2={CX} y2="186" stroke={PALE} strokeWidth="2.8" />

      {/* Everything below is the bucket, scaled up around its top-center */}
      <g transform={`translate(100 190) scale(${BUCKET_SCALE}) translate(-100 -190)`}>
        {/* Bucket handle */}
        <path d="M64 190 Q100 174 136 190 Z" fill="none" stroke={PALE} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Bucket body */}
        <polygon points="56,192 144,192 130,238 70,238" fill="rgba(159,197,207,0.12)" />

        {/* Water lines */}
        <g clipPath="url(#bucket-clip)" stroke={PALE} strokeWidth="1" opacity="0.3">
          <line x1="50" y1="200" x2="150" y2="200" />
          <line x1="50" y1="209" x2="150" y2="209" />
          <line x1="50" y1="218" x2="150" y2="218" />
          <line x1="50" y1="227" x2="150" y2="227" />
        </g>

        {/* Fish */}
        <g clipPath="url(#bucket-clip)">
          {SLOTS.slice(0, n).map(([x, y], i) => (
            <Fish key={i} x={x} y={y} color={i % 2 === 0 ? PALE : CORAL} flip={i % 3 === 0} />
          ))}
        </g>

        {/* Bucket outline and rim */}
        <polygon points="56,192 144,192 130,238 70,238" fill="none" stroke={PALE} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="52" y="188" width="96" height="6" rx="3" fill="#1d4a58" stroke={PALE} strokeWidth="2.5" />
      </g>
    </svg>
  )
}

export default function KilosScaleStep({ draft, set }: { draft: Draft; set: (patch: Partial<Draft>) => void }) {
  const kg = draft.kg
  const clamp = (v: number) => Math.max(1, Math.min(MAX_KG, Math.round(v)))
  const stepOf = (v: number) => (v < 10 ? 1 : v < 50 ? 5 : 10)
  const dec = () => set({ kg: clamp(kg - stepOf(kg - 1)) })
  const inc = () => set({ kg: clamp(kg + stepOf(kg)) })

  return (
    <div className="space-y-6">
      {/* No white card: the scale sits on the app background */}
      <ScaleArt kg={kg} />

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={dec}
          disabled={kg <= 1}
          aria-label="Decrease kilos"
          className="grid size-14 place-items-center rounded-full border-2 border-[#86c5da]/40 text-white transition active:scale-95 disabled:opacity-30"
        >
          <Minus size={24} strokeWidth={2.2} />
        </button>

        <p className="min-w-32 text-center font-display text-5xl font-bold text-white" aria-live="polite">
          {kg} <span className="text-xl font-semibold text-[#86c5da]">kg</span>
        </p>

        <button
          type="button"
          onClick={inc}
          disabled={kg >= MAX_KG}
          aria-label="Increase kilos"
          className="grid size-14 place-items-center rounded-full border-2 border-[#86c5da]/40 text-white transition active:scale-95 disabled:opacity-30"
        >
          <Plus size={24} strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-2">
        <input
          type="range"
          min={1}
          max={MAX_DIAL}
          value={Math.min(kg, MAX_DIAL)}
          onChange={(e) => set({ kg: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-teal-900/60 accent-[#86c5da]"
          aria-label="Kilos slider"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {QUICK.map((q) => {
          const active = kg === q
          return (
            <button
              key={q}
              type="button"
              onClick={() => set({ kg: q })}
              className={`min-h-11 min-w-16 rounded-full border px-4 text-sm font-semibold transition ${
                active
                  ? 'border-[#86c5da] bg-[#86c5da] text-[#09222B]'
                  : 'border-teal-800/60 bg-[#0c2e38] text-teal-100 hover:bg-[#113d4b]'
              }`}
            >
              {q} kg
            </button>
          )
        })}
      </div>
    </div>
  )
}