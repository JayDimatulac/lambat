import type { RiskLevel } from '../lib/risk'
import type { Model } from '../lib/estimator'

export type Shape = 'tuna' | 'scad' | 'sardine' | 'mackerel' | 'moon'
export type Outcome = 'sold' | 'shared' | 'lost'

export type Catch = {
  id: string
  species: string
  speciesId?: string
  shape: Shape
  kg: number
  place: string
  caughtAt: number
  hoursAgo: number
  risk: RiskLevel
  hoursMin: number
  hoursMax: number
  minsMin: number // minutes left, cautious end (the countdown)
  minsMax: number
  model?: Model // what the estimator needs to re-work the time when ice is added
  outcome?: Outcome // undefined = still active
  closedAt?: number
}

// The tide measures time left on one shared scale: at 24h or more a buoy floats, at 0h it reaches the seabed.
export const HORIZON_H = 24

export const user = { name: 'Mang Ramon', initials: 'MR', place: 'Balayan' }

export const isActive = (c: Catch) => !c.outcome
export const byUrgency = (a: Catch, b: Catch) => a.hoursMin - b.hoursMin

// Earlier this week (not in the list above). Catches you close in the app are added on top of this.
export const weekBase: Record<Outcome, { n: number; kg: number }> = {
  sold: { n: 6, kg: 88 },
  shared: { n: 1, kg: 12 },
  lost: { n: 0, kg: 0 },
}