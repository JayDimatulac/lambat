import { useState } from 'react'
import SkyArc from './SkyArc'

// The "when was it caught" picture: a sun (day) or moon (night) travelling along a bow.
// It keeps the same props as before, so the screen that uses DayBar does not change.
export default function DayBar({ hoursAgo }: { hoursAgo: number; caughtLabel?: string; nowLabel?: string }) {
  const [now] = useState(() => new Date())
  const caughtAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
  return <SkyArc caughtAt={caughtAt} now={now} />
}