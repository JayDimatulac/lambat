import { ParolaScene } from '../home/ParolaPanel'
import { useSettings } from '../../lib/settings'

// The dashboard's parola scene as the sign-in background. Day: sun and clouds. Night: stars and a sweeping beam.
const BG_DAY = 'linear-gradient(180deg, #7fcde0 0%, #d6eff1 60%, #fde3c8 95%, #0f6e7a 95%, #0a4f5c 100%)'
const BG_NIGHT = 'linear-gradient(180deg, #05171e 0%, #0f4a5c 70%, #05171e 100%)'

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const STARS = Array.from({ length: 42 }, (_, i) => ({
  x: rnd(i) * 100,
  y: rnd(i + 99) * 72,
  r: 0.8 + rnd(i + 7) * 1.4,
  d: rnd(i + 3) * 3,
}))

export default function AuthLighthouse() {
  const { theme } = useSettings()
  const night = theme === 'night'

  return (
    <>
      <div aria-hidden className="absolute inset-0" style={{ background: night ? BG_NIGHT : BG_DAY }} />

      {night && (
        <svg aria-hidden="true" className="absolute inset-0 size-full">
          {STARS.map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" className="anim-twinkle" style={{ animationDelay: `${s.d}s` }} />
          ))}
        </svg>
      )}

      {/* the same scene as the dashboard, sized for this panel */}
      <div aria-hidden className="pointer-events-none absolute bottom-8 left-0 w-full max-w-[640px] lg:bottom-0">
        <ParolaScene alert={false} night={night} bare className="block w-full overflow-visible" />
      </div>
    </>
  )
}