// Rough distances between towns, so the radar can place a buyer relative to a fisher.
// Town-level only: two people in the same town are shown about 0.5 km apart.
type LL = [number, number]


//  Town centers: Batangas' 1st district, the western coast (1 city and 7 municipalities).
const PLACES: Record<string, LL> = {
  Nasugbu: [14.0722, 120.6319],
  Lian: [14.0389, 120.6542],
  Tuy: [14.0167, 120.7333],
  Balayan: [13.9389, 120.7326],
  Calatagan: [13.8317, 120.6322],
  Calaca: [13.9333, 120.8133],
  Lemery: [13.8833, 120.9167],
  Taal: [13.8761, 120.9239],
}
export const TOWNS = Object.keys(PLACES)
const BASE = PLACES.Balayan

/* The known town inside a place name, so "Poblacion, Balayan" gives "Balayan". Empty if none is known. */
export const townOf = (name?: string) => {
  const k = (name ?? '').toLowerCase()
  return TOWNS.find((t) => k.includes(t.toLowerCase())) ?? ''
}

/* Real coordinates of the known town in a place name, or null. Unlike locate(), this never makes up a spot. */
export const knownCoords = (name?: string): LL | null => {
  const town = townOf(name)
  return town ? PLACES[town] : null
}

const hash = (s: string) => {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/* Where a place is. An unknown place gets a steady spot 2 to 10 km from Balayan, so it does not jump around. */
export function locate(name?: string): LL {
  const town = townOf(name)
  if (town) return PLACES[town]
  const h = hash((name ?? '').toLowerCase() || 'x')
  const a = ((h % 360) * Math.PI) / 180
  const km = 2 + ((h >>> 9) % 80) / 10
  return [BASE[0] + (km * Math.cos(a)) / 111, BASE[1] + (km * Math.sin(a)) / (111 * Math.cos((BASE[0] * Math.PI) / 180))]
}

const rad = (d: number) => (d * Math.PI) / 180

/* Distance in km and the direction (0 is north, clockwise) from one place to another. */
export function between(from: LL, to: LL, seed: string) {
  const dLat = rad(to[0] - from[0])
  const dLon = rad(to[1] - from[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from[0])) * Math.cos(rad(to[0])) * Math.sin(dLon / 2) ** 2
  const raw = 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  const y = Math.sin(dLon) * Math.cos(rad(to[0]))
  const z = Math.cos(rad(from[0])) * Math.sin(rad(to[0])) - Math.sin(rad(from[0])) * Math.cos(rad(to[0])) * Math.cos(dLon)
  const bearing = raw < 0.1 ? hash(seed) % 360 : (Math.atan2(y, z) * 180 / Math.PI + 360) % 360
  return { km: Math.max(raw, 0.5), bearing }
}