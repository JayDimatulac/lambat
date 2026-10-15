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