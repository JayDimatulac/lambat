import type { RiskLevel } from './risk'

// Shelf life comes from your Species table (hours at 0°C). A temperature formula stretches or
// shortens it. We have no thermometer, so the amount of ice stands in for the temperature.
//
// ASSUMPTIONS TO CHECK (these are mine, not from your research):
//  1. The formula: relative rate of spoilage = (1 + 0.1 * T)^2, with T in °C. Use your own "general formula" if it differs.
//  2. AMBIENT_C and ICE_TEMP_C: what temperature each ice level roughly gives. Replace with something you can cite.
//  3. The 0.9 / 1.1 margins on each end of the range.

export type IceUnit = 'sako' | 'block'
export type IceLevel = 'none' | 'low' | 'fair' | 'good' | 'plenty'
export const ICE_LEVELS: IceLevel[] = ['none', 'low', 'fair', 'good', 'plenty']

export const ICE_KG: Record<IceUnit, number> = { sako: 25, block: 25 } // kg of ice in one sack / block (placeholder)

export const AMBIENT_C = 30
export const ICE_TEMP_C: Record<IceLevel, number> = { none: AMBIENT_C, low: 18, fair: 10, good: 5, plenty: 2 }

// No thermometer: only how much ice there is compared with the weight of the fish
export function iceLevel(iceKg: number, fishKg: number): IceLevel {
  if (iceKg <= 0) return 'none'
  const ratio = iceKg / Math.max(fishKg, 1)
  if (ratio < 0.25) return 'low'
  if (ratio < 0.5) return 'fair'
  if (ratio < 1) return 'good'
  return 'plenty'
}

// How many times faster the fish spoils at tempC than at 0°C
export const relativeRate = (tempC: number) => (1 + 0.1 * tempC) ** 2

export function riskFor(midHoursLeft: number): RiskLevel {
  if (midHoursLeft <= 2) return 'critical'
  if (midHoursLeft <= 6) return 'high'
  if (midHoursLeft <= 14) return 'moderate'
  return 'low'
}

const HOUR = 3_600_000

// Everything we need to work out the time left, now or after more ice is added.
// events[0] is the catch itself. Every later event is ice added. iceKg is the total ice on the fish from that moment.
export type IceEvent = { at: number; iceKg: number }
export type Model = { l0Min: number; l0Max: number; histamine: boolean; kg: number; events: IceEvent[] }

function lifeAt(m: Model, iceKg: number) {
  const rate = relativeRate(ICE_TEMP_C[iceLevel(iceKg, m.kg)])
  const min = (m.l0Min / rate) * 0.9
  // tuna and mackerel: no optimistic end, the cautious number is the number
  const max = m.histamine ? min : (m.l0Max / rate) * 1.1
  return { min, max }
}

// Fish "use up" their shelf life. Each stretch of time with the same ice uses up a share of it,
// and what is left lasts according to the ice on the fish right now.
export function remaining(m: Model, now: number) {
  let usedMin = 0
  let usedMax = 0
  m.events.forEach((ev, i) => {
    const to = Math.min(now, m.events[i + 1]?.at ?? now)
    if (to <= ev.at) return
    const life = lifeAt(m, ev.iceKg)
    usedMin += (to - ev.at) / HOUR / life.min
    usedMax += (to - ev.at) / HOUR / life.max
  })
  const iceKg = m.events[m.events.length - 1].iceKg
  const life = lifeAt(m, iceKg)
  return {
    leftMin: Math.max(0, (1 - usedMin) * life.min),
    leftMax: Math.max(0, (1 - usedMax) * life.max),
    level: iceLevel(iceKg, m.kg),
  }
}

// Hours the fish keeps at room temperature with no ice (used for the "why" text)
export const hoursAtAmbient = (l0Min: number) => l0Min / relativeRate(AMBIENT_C)