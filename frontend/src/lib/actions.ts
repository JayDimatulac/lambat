import type { Catch } from '../data/mock'
import type { Key } from './i18n'
import { pathwaysFor } from './pathways'

export type StrandId = 'sell' | 'buyer' | 'share' | 'value'
export type StrandState = { status: 'best' | 'open' | 'locked'; reason?: Key; hint?: string }

// the actions the server can suggest (the rules live in Backend/src/lib/nextAction.ts)
export type ActionCode = 'FIND_BUYER' | 'SHARE_CATCH' | 'ADD_ICE' | 'EXPLORE_PROCESSING' | 'REVIEW_CATCH'

// which strand of the Fork glows for each action. Adding ice and reviewing the catch have no strand.
export function strandForAction(action: ActionCode, supported: boolean): StrandId | null {
  if (!supported) return null
  if (action === 'FIND_BUYER') return 'buyer'
  if (action === 'SHARE_CATCH') return 'share'
  if (action === 'EXPLORE_PROCESSING') return 'value'
  return null
}

// The glow used until the server answers (or when it cannot): the old placeholder rules.
// The value-added strand is not a placeholder: it follows your Value-Added Pathway Rules table.
function placeholderStrands(c: Catch): Record<StrandId, StrandState> {
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

// best: undefined = the server has not answered yet, use the placeholder rules
//       null      = the server chose something with no strand, so nothing glows
//       a strand  = only that strand glows (locked strands stay locked)
export function strandsFor(c: Catch, best?: StrandId | null): Record<StrandId, StrandState> {
  const base = placeholderStrands(c)
  if (best === undefined) return base
  const out = { ...base }
  for (const id of Object.keys(out) as StrandId[]) {
    if (out[id].status === 'best') out[id] = { ...out[id], status: 'open' }
  }
  if (best && out[best].status === 'open') out[best] = { ...out[best], status: 'best' }
  return out
}