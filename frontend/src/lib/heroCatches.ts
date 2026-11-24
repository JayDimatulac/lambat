import { byUrgency, isActive, needsAttention, type Catch } from '../data/mock'

const riskRank = (c: Catch) => (c.risk === 'critical' ? 2 : c.risk === 'high' ? 1 : 0)

// Phone hero: up to two buoys. Catches that need attention (Unahin) take the first slots,
// most urgent first. Whatever room is left goes to the active catch with the least time left.
// Nothing active: an empty list.
export function pickHeroCatches(catches: Catch[], max = 2): Catch[] {
  const active = catches.filter(isActive).sort(byUrgency)
  const first = active
    .filter(needsAttention)
    .sort((a, b) => riskRank(b) - riskRank(a) || a.hoursMin - b.hoursMin)
  const rest = active.filter((c) => !first.includes(c))
  return [...first, ...rest].slice(0, max)
}
