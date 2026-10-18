import type { Catch } from '../data/mock'
import type { Key } from './i18n'

// SAMPLE buyers and recipients around Balayan and Calatagan, made up for the demo. The screens label them as sample data.
// Replace these with real ones when the backend has them. Prices below are sample prices, not research.
export type PartyType = 'market' | 'trader' | 'restaurant' | 'smokehouse' | 'school' | 'barangay' | 'parish' | 'coop'
export type Kind = 'buyer' | 'share'

export type Party = {
  id: string
  kind: Kind
  name: string
  type: PartyType
  km: number // distance from the pier
  bearing: number // degrees, 0 is north
  opens: number // hour of day
  closes: number
  accepts?: string[] // the fish it takes (none listed means any)
  priceFactor?: number // buyers: how its price compares with the usual
  capacityKg?: number // recipients: how much it can take
}

export const PARTIES: Party[] = [
  { id: 'b1', kind: 'buyer', name: 'Mang Tonyo’s Fish Stall', type: 'market', km: 2.4, bearing: 70, opens: 5, closes: 17, priceFactor: 1 },
  { id: 'b2', kind: 'buyer', name: 'Ate Liza’s Dried Fish', type: 'trader', km: 4.8, bearing: 150, opens: 6, closes: 16, accepts: ['Galunggong', 'Matambaka', 'Tamban', 'Hiwas'], priceFactor: 0.92 },
  { id: 'b3', kind: 'buyer', name: 'Calatagan Pier Traders', type: 'trader', km: 7.5, bearing: 20, opens: 4, closes: 18, priceFactor: 1.08 },
  { id: 'b4', kind: 'buyer', name: 'Lemery Seafood Grill', type: 'restaurant', km: 11, bearing: 250, opens: 10, closes: 21, accepts: ['Alumahan', 'Tambakol', 'Gulyasan', 'Tulingang bilog', 'Galunggong'], priceFactor: 1.12 },
  { id: 'b5', kind: 'buyer', name: 'Tuy Tinapa Smokehouse', type: 'smokehouse', km: 14, bearing: 110, opens: 6, closes: 17, accepts: ['Alumahan', 'Tulingang bilog', 'Tambakol', 'Gulyasan'], priceFactor: 1 },
  { id: 'b6', kind: 'buyer', name: 'Batangas City Market Trader', type: 'trader', km: 22, bearing: 300, opens: 3, closes: 15, priceFactor: 1.15 },
  { id: 's1', kind: 'share', name: 'Barangay feeding program', type: 'barangay', km: 1.6, bearing: 200, opens: 7, closes: 17, capacityKg: 25 },
  { id: 's2', kind: 'share', name: 'Elementary school feeding', type: 'school', km: 3.9, bearing: 330, opens: 7, closes: 15, capacityKg: 20 },
  { id: 's3', kind: 'share', name: 'Parish outreach kitchen', type: 'parish', km: 5.2, bearing: 40, opens: 8, closes: 18, capacityKg: 30 },
  { id: 's4', kind: 'share', name: 'Fisherfolk cooperative', type: 'coop', km: 9.8, bearing: 180, opens: 6, closes: 16, capacityKg: 60 },
]

// Sample usual prices in pesos per kilo
export const BASE_PRICE: Record<string, number> = {
  Galunggong: 180, Matambaka: 190, Tamban: 85, Alumahan: 215, 'Tulingang bilog': 165, Tambakol: 260, Gulyasan: 135, Hiwas: 105,
}

export const MAX_KM = 25
const SPEED_KMH = 20 // a tricycle or jeepney, with the stops
const HANDLING_MIN = 10

export type Match = {
  party: Party
  travelMins: number
  price?: number
  total?: number
  reachable: boolean
  no?: Key
  score: number // 0 to 100, only for those you can reach
  why: Key[]
}

// A match is a rule, not a guess: price, how much time is left over after the trip, and distance.
export function matchesFor(c: Catch, kind: Kind, now = new Date()): Match[] {
  const nowH = now.getHours() + now.getMinutes() / 60
  const all: Match[] = PARTIES.filter((p) => p.kind === kind).map((party) => {
    const travelMins = Math.round((party.km / SPEED_KMH) * 60) + HANDLING_MIN
    const arrival = nowH + travelMins / 60
    const takesIt = !party.accepts || party.accepts.includes(c.species)
    const open = arrival >= party.opens && arrival < party.closes
    const no: Key | undefined = !takesIt ? 'm.nofish' : travelMins > c.minsMin ? 'm.nofar' : !open ? 'm.noclosed' : undefined
    const price = kind === 'buyer' ? Math.round((BASE_PRICE[c.species] ?? 100) * (party.priceFactor ?? 1)) : undefined
    return { party, travelMins, price, total: price !== undefined ? price * c.kg : undefined, reachable: !no, no, score: 0, why: [] }
  })

  const ok = all.filter((m) => m.reachable)
  const maxPrice = Math.max(1, ...ok.map((m) => m.price ?? 0))
  const slackOf = (m: Match) => Math.max(0, 1 - m.travelMins / Math.max(c.minsMin, 1))
  const nearest = Math.min(...ok.map((m) => m.party.km))
  ok.forEach((m) => {
    const near = 1 - m.party.km / MAX_KM
    const fits = (m.party.capacityKg ?? 0) >= c.kg ? 1 : 0.5
    m.score = Math.round(100 * (kind === 'buyer' ? 0.45 * ((m.price ?? 0) / maxPrice) + 0.4 * slackOf(m) + 0.15 * near : 0.5 * slackOf(m) + 0.3 * near + 0.2 * fits))
    if (m.price !== undefined && m.price === maxPrice) m.why.push('m.price')
    if (m.party.km === nearest) m.why.push('m.near')
    if (slackOf(m) >= 0.6 && m.why.length < 2) m.why.push('m.time')
    if (kind === 'share' && fits === 1 && m.why.length < 2) m.why.push('m.cap')
  })

  return all.sort((a, b) => Number(b.reachable) - Number(a.reachable) || b.score - a.score || a.party.km - b.party.km)
}

export const hourLabel = (h: number) => `${((Math.floor(h) + 11) % 12) + 1}${h % 24 < 12 ? ' AM' : ' PM'}`