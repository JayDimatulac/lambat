import type { Catch } from '../data/mock'
import type { Key } from './i18n'
import { pathwaysFor } from './pathways'

export type StrandId = 'sell' | 'buyer' | 'share' | 'value'
export type StrandState = { status: 'best' | 'open' | 'locked'; reason?: Key; hint?: string }

// PLACEHOLDER RULES for which strand is the best choice (sell, buyer, share).
// Swap these for the rules of your Catch Action Center.
// The value-added strand is not a placeholder: it follows your Value-Added Pathway Rules table.
export function strandsFor(c: Catch): Record<StrandId, StrandState> {
  const best: StrandState = { status: 'best' }
  const open: StrandState = { status: 'open' }
  const { available, reason } = pathwaysFor(c)
  const value: StrandState = available.length
    ? { status: 'open', hint: [...new Set(available.map((p) => p.name))].join(' · ') }
    : { status: 'locked', reason }
  switch (c.risk) {
    case 'low':
    case 'moderate':
      return { sell: open, buyer: best, share: open, value }
    case 'high':
      return { sell: best, buyer: open, share: open, value }
    default:
      return { sell: best, buyer: { status: 'locked', reason: 'lock.buyer' }, share: best, value }
  }
}