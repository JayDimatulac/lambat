// "3–5 oras ang natitira"
export function formatRemaining(hoursMin: number, hoursMax: number) {
  const range = hoursMin === hoursMax ? `${hoursMin}` : `${hoursMin}–${hoursMax}`
  return `${range} oras ang natitira`
}

// Clock time to sell by, based on the SHORTEST estimate, rounded DOWN to the half hour.
export function sellBy(hoursMin: number) {
  const HALF_HOUR = 30 * 60 * 1000
  const t = new Date(Math.floor((Date.now() + hoursMin * 60 * 60 * 1000) / HALF_HOUR) * HALF_HOUR)
  const time = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (t.toDateString() === today.toDateString()) return time
  if (t.toDateString() === tomorrow.toDateString()) return `${time} bukas`
  return `${time}, ${t.toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}`
}