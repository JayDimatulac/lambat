// A lifebuoy (salbabida) that is also a clock. Eight bands, each is 3 hours of the 24-hour tide.
// The bands go dark one by one as the time runs out. The number in the middle is the time left.
const R = 37
const WIDTH = 15
const point = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [50 + R * Math.cos(a), 50 + R * Math.sin(a)]
}

type Props = { leftMins: number; hoursLabel: string; size?: number }

export default function LifebuoyTimer({ leftMins, hoursLabel, size = 96 }: Props) {
  const lit = Math.min(8, Math.max(1, Math.ceil(leftMins / 60 / 3)))
  const hours = Math.floor(leftMins / 60)
  const value = hours >= 1 ? hours : Math.max(0, leftMins)
  const unit = hours >= 1 ? hoursLabel : 'min'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value} ${unit}`}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => {
          const [x0, y0] = point(-90 + i * 45 + 2)
          const [x1, y1] = point(-90 + i * 45 + 43)
          const on = i < lit
          return (
            <path
              key={i}
              d={`M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}`}
              fill="none"
              strokeWidth={WIDTH}
              style={{ stroke: on ? (i % 2 ? 'var(--color-cream)' : 'var(--color-coral)') : 'rgba(255,255,255,0.14)', transition: 'stroke 0.4s' }}
            />
          )
        })}
        <circle cx="50" cy="50" r={R + WIDTH / 2} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r={R - WIDTH / 2} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center text-white">
        <span className="font-numeral text-[30px] font-extrabold leading-none tabular-nums">{value}</span>
        <span className="mt-0.5 text-xs font-semibold leading-none">{unit}</span>
      </div>
    </div>
  )
}