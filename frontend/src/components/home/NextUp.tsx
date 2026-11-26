
import type { Catch } from '../../data/mock'

interface NextUpProps {
  catches: Catch[]
}

export default function NextUp({ catches }: NextUpProps) {
  return (
    <div className="space-y-3">
      {catches.map((catchItem) => (
        <div
          key={catchItem.id}
          className="rounded-xl border border-white/70 bg-white/80 p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-deep">
              {catchItem.species}
            </h3>

            <span className="text-sm font-semibold text-deep">
              {catchItem.kg} kg
            </span>
          </div>

          <p className="mt-1 text-sm text-ink-soft">
            {catchItem.place}
          </p>

          <p className="mt-1 text-xs text-ink-soft">
            {catchItem.hoursMin} hours remaining
          </p>
        </div>
      ))}
    </div>
  )
}
