// The 24 hours of a fishing day. Shows when the fish was caught and where "now" is on the clock.
const hourOf = (hoursAgo: number) => {
  const d = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  return d.getHours() + d.getMinutes() / 60
}

export default function DayBar({ hoursAgo, caughtLabel, nowLabel }: { hoursAgo: number; caughtLabel: string; nowLabel: string }) {
  const caught = (hourOf(hoursAgo) / 24) * 100
  const now = (hourOf(0) / 24) * 100
  return (
    <div className="space-y-1" aria-hidden="true">
      <div className="relative pt-8">
        <div
          className="h-4 rounded-full"
          style={{ background: 'linear-gradient(90deg, #0a2f3c 0%, #2e8391 24%, #f2b893 30%, #fbd9b8 50%, #f2b893 70%, #2e8391 78%, #0a2f3c 100%)' }}
        />
        {[
          { pos: caught, label: caughtLabel, cls: 'bg-coral' },
          { pos: now, label: nowLabel, cls: 'bg-teal' },
        ].map((m) => (
          <div key={m.label} className="absolute top-0 -translate-x-1/2 transition-all duration-300" style={{ left: `${m.pos}%` }}>
            <span className="block whitespace-nowrap rounded-full bg-card px-2 text-xs font-bold shadow-rest">{m.label}</span>
            <span className={`mx-auto mt-0.5 block size-3 rounded-full border-2 border-card ${m.cls}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink-soft">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>
    </div>
  )
}