// Tally marks: four strokes and a slash make a group of five.
export default function Tally({ count, className = '' }: { count: number; className?: string }) {
  const groups = Math.floor(count / 5)
  const rest = count % 5
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`} aria-hidden="true">
      {Array.from({ length: groups }, (_, i) => (
        <svg key={i} width="30" height="26" viewBox="0 0 30 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M5 3V22M11 3.4V22M17 3V22.4M23 3.4V22" />
          <path d="M1.5 19.5L27 6.5" />
        </svg>
      ))}
      {rest > 0 && (
        <svg width={rest * 6 + 4} height="26" viewBox={`0 0 ${rest * 6 + 4} 26`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          {Array.from({ length: rest }, (_, i) => (
            <path key={i} d={`M${5 + i * 6} ${3 + (i % 2) * 0.4}V${22 - (i % 2) * 0.4}`} />
          ))}
        </svg>
      )}
    </div>
  )
}