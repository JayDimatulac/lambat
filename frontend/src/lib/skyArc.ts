export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

const hourOf = (d: Date) => d.getHours() + d.getMinutes() / 60

/** 0 = left horizon, 1 = right horizon. Day: 6AM→6PM. Night: 6PM→6AM on the same bow. */
export function bowProgress(d: Date): number {
  return ((hourOf(d) - 6 + 24) % 12) / 12
}

export function isDaytime(d: Date): boolean {
  const h = d.getHours()
  return h >= 6 && h < 18
}

export function phaseOf(d: Date): Phase {
  const h = hourOf(d)
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 16) return 'day'
  if (h >= 16 && h < 19) return 'dusk'
  return 'night'
}

/** A point on the half-circle bow. */
export function bowPoint(p: number, cx: number, cy: number, r: number) {
  const a = Math.PI * (1 - p)
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
}

export function dayLabel(caught: Date, now: Date): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((start(now) - start(caught)) / 86400000)
  return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`
}