import type { Lang } from './settings'
import type { TFn } from './i18n'

// "3–5" or "8"
export function rangeText(hoursMin: number, hoursMax: number) {
  return hoursMin === hoursMax ? `${hoursMin}` : `${hoursMin}–${hoursMax}`
}

// "3h ago" / "2d ago"
export function agoText(hoursAgo: number, t: TFn) {
  return hoursAgo < 24 ? t('ago.h', { n: hoursAgo }) : t('ago.d', { n: Math.round(hoursAgo / 24) })
}

// Clock time to sell by: SHORTEST estimate, rounded DOWN to the half hour.
export function sellByText(hoursMin: number, lang: Lang | null, t: TFn) {
  const HALF_HOUR = 30 * 60 * 1000
  const when = new Date(Math.floor((Date.now() + hoursMin * 60 * 60 * 1000) / HALF_HOUR) * HALF_HOUR)
  const time = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (when.toDateString() === today.toDateString()) return t('sellby.today', { time })
  if (when.toDateString() === tomorrow.toDateString()) return t('sellby.tomorrow', { time })
  const date = when.toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' })
  return t('sellby.later', { time, date })
}

// "5:30 AM", "5:30 AM yesterday" or "5:30 AM, Oct 13": the clock time N hours ago
export function catchTimeText(hoursAgo: number, lang: Lang | null, t: TFn) {
  const when = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  const time = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (when.toDateString() === today.toDateString()) return time
  if (when.toDateString() === yesterday.toDateString()) return `${time} ${t('when.yesterday').toLowerCase()}`
  return `${time}, ${when.toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' })}`
}

// "5:30 AM", "5:30 AM yesterday" or "5:30 AM, Oct 13" for any moment
export function clockText(ts: number, lang: Lang | null, t: TFn) {
  const when = new Date(ts)
  const time = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (when.toDateString() === today.toDateString()) return time
  if (when.toDateString() === yesterday.toDateString()) return `${time} ${t('when.yesterday').toLowerCase()}`
  return `${time}, ${when.toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric' })}`
}

// "2h 41m", "41m", "3d 4h": a countdown from minutes
export function countdownText(mins: number) {
  if (mins >= 36 * 60) return `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
  return `${mins}m`
}