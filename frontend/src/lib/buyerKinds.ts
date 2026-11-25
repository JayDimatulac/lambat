import type { Account } from './accounts'

type L = { en: string; fil: string }
export const pick = (l: L, lang?: string | null) => (lang === 'fil' ? l.fil : l.en)

export type Proof = L & { key: string }
export type BuyerKind = L & { key: string; tier: 'business' | 'small'; hint: L; proofs: Proof[] }
export type BuyerReq = { proof?: string; number?: string; issuer?: string; validUntil?: string; regNo?: string }

const permit: Proof = { key: 'permit', en: "Mayor's / business permit", fil: 'Permit ng alkalde / negosyo' }
const clearance: Proof = { key: 'clearance', en: 'Barangay clearance', fil: 'Barangay clearance' }
const stall: Proof = { key: 'stall', en: 'Market stall permit or lease', fil: 'Permit o kontrata sa pwesto sa palengke' }
const sanitary: Proof = { key: 'sanitary', en: 'Sanitary permit', fil: 'Sanitary permit' }
const coop: Proof = { key: 'coop', en: 'Co-op or association certificate (CDA / LGU)', fil: 'Sertipiko ng kooperatiba o samahan (CDA / LGU)' }
const lgu: Proof = { key: 'lgu', en: 'LGU or fisheries office confirmation', fil: 'Kumpirmasyon mula sa LGU o fisheries office' }

const SMALL: L = { en: 'A barangay clearance is enough to start.', fil: 'Sapat na ang barangay clearance para makapagsimula.' }
const BUSINESS: L = { en: 'A business permit and your registration number are required.', fil: 'Kailangan ang business permit at ang registration number.' }

export const BUYER_KINDS: BuyerKind[] = [
  { key: 'vendor', tier: 'small', en: 'Market vendor (suki)', fil: 'Nagtitinda sa palengke (suki)', hint: SMALL, proofs: [clearance, stall, lgu] },
  { key: 'reseller', tier: 'small', en: 'Reseller or trader', fil: 'Reseller o negosyante', hint: SMALL, proofs: [clearance, permit, lgu] },
  { key: 'home', tier: 'small', en: 'Home-based maker (tinapa, tuyo, bagoong)', fil: 'Gumagawa sa bahay (tinapa, tuyo, bagoong)', hint: SMALL, proofs: [clearance, sanitary, lgu] },
  { key: 'eatery', tier: 'small', en: 'Carinderia or small eatery', fil: 'Karinderya o maliit na kainan', hint: SMALL, proofs: [clearance, permit] },
  { key: 'restaurant', tier: 'business', en: 'Restaurant, hotel or resort', fil: 'Restawran, hotel o resort', hint: BUSINESS, proofs: [permit] },
  { key: 'processor', tier: 'business', en: 'Processor or cold storage', fil: 'Processor o cold storage', hint: BUSINESS, proofs: [permit, sanitary] },
  { key: 'coop', tier: 'business', en: 'Cooperative or association', fil: 'Kooperatiba o samahan', hint: BUSINESS, proofs: [coop, permit] },
]

// accounts made before this list used these four types
const LEGACY: Record<string, string> = { market: 'vendor', trader: 'reseller', smokehouse: 'home', restaurant: 'restaurant' }

export function kindOf(type?: string | null): BuyerKind | undefined {
  if (!type) return undefined
  const key = LEGACY[type] ?? type
  return BUYER_KINDS.find((k) => k.key === key)
}

const F = {
  proof: { en: 'Document', fil: 'Dokumento' },
  number: { en: 'Document no.', fil: 'Numero ng dokumento' },
  issuer: { en: 'Issued by', fil: 'Inilabas ng' },
  validUntil: { en: 'Valid until', fil: 'May bisa hanggang' },
  regNo: { en: 'DTI / SEC / CDA no.', fil: 'DTI / SEC / CDA no.' },
}

export type ReqRow = { key: string; label: string; value: string | null; required: boolean }

export function requirementRows(kind: BuyerKind | undefined, r: BuyerReq | undefined, lang?: string | null): ReqRow[] {
  const proof = kind?.proofs.find((p) => p.key === r?.proof)
  const rows: ReqRow[] = [
    { key: 'proof', label: pick(F.proof, lang), value: proof ? pick(proof, lang) : r?.proof?.trim() || null, required: true },
    { key: 'number', label: pick(F.number, lang), value: r?.number?.trim() || null, required: true },
    { key: 'issuer', label: pick(F.issuer, lang), value: r?.issuer?.trim() || null, required: true },
    { key: 'validUntil', label: pick(F.validUntil, lang), value: r?.validUntil?.trim() || null, required: false },
  ]
  if (kind?.tier === 'business') rows.push({ key: 'regNo', label: pick(F.regNo, lang), value: r?.regNo?.trim() || null, required: true })
  return rows
}

export const missingCount = (rows: ReqRow[]) => rows.filter((r) => r.required && !r.value).length

// the requirements a buyer entered at registration (once the form collects them)
export const reqOf = (a: Account): BuyerReq | undefined =>
  (a.buyer as unknown as { requirements?: BuyerReq } | undefined)?.requirements