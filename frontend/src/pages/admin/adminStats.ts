import type { Account } from '../../lib/accounts'

export const DAY = 86_400_000

export type Period = '7' | '30' | '90' | 'all'
export const PERIODS: { k: Period; label: string }[] = [
  { k: '7', label: 'Last 7 days' },
  { k: '30', label: 'Last 30 days' },
  { k: '90', label: 'Last 90 days' },
  { k: 'all', label: 'All time' },
]

export const ROLE_LABEL: Record<string, string> = {
  fisherfolk: 'Fisherfolk',
  buyer: 'Business Buyer',
  organization: 'Organization',
}
export const STATUS_LABEL: Record<Account['status'], string> = {
  PENDING: 'Pending',
  ACTIVE: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Paused',
}

// the registered barangay stands in for the municipality until the account has a municipality field
// the first district of Batangas, in alphabetical order
export const MUNICIPALITIES = ['Balayan', 'Calaca City', 'Calatagan', 'Lemery', 'Lian', 'Nasugbu', 'Taal', 'Tuy']

// accounts have no municipality field yet, so it is read from the barangay, business address or landing site text
const MUNI_RE = MUNICIPALITIES.map((m) => [m, new RegExp(`\\b${m.replace(' City', '')}\\b`, 'i')] as const)
export function muniOf(a: Account): string | null {
  const text = [a.barangay, a.buyer?.address, a.fisher?.landing].filter(Boolean).join(' ')
  return MUNI_RE.find(([, re]) => re.test(text))?.[0] ?? null
}
export const areaOf = (a: Account) => muniOf(a) ?? (a.barangay?.trim() || '—')
export const areasOf = (_list?: Account[]) => MUNICIPALITIES

// a display reference built from the registration year and the end of the account id (not stored anywhere yet)
export const refOf = (a: Account) => `APP-${new Date(a.createdAt).getFullYear()}-${a.id.slice(-4).toUpperCase()}`

export const madeBetween = (list: Account[], from: number, to: number) =>
  list.filter((a) => a.createdAt >= from && a.createdAt < to).length

export function changePct(cur: number, prev: number): number | null {
  return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null
}

export type Point = { label: string; fisher: number; buyer: number }

// accounts submitted per day (up to 31 days) or per week (longer), split into fisherfolk and buyers
export function bucketSeries(list: Account[], from: number, to: number): Point[] {
  const span = Math.max(DAY, to - from)
  const step = span <= 31 * DAY ? DAY : 7 * DAY
  const n = Math.max(2, Math.ceil(span / step))
  return Array.from({ length: n }, (_, i) => {
    const start = from + i * step
    const inside = (a: Account) => a.createdAt >= start && a.createdAt < start + step
    return {
      label: new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fisher: list.filter((a) => a.role === 'fisherfolk' && inside(a)).length,
      buyer: list.filter((a) => a.role === 'buyer' && inside(a)).length,
    }
  })
}
export const fmtMobile = (m: string) => m.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')