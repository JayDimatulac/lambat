import type { RiskLevel } from '../lib/risk'

export type Shape = 'tuna' | 'scad' | 'sardine' | 'mackerel' | 'moon'
export type Outcome = 'sold' | 'shared' | 'lost'

export type Catch = {
  id: string
  species: string
  shape: Shape
  kg: number
  place: string
  hoursAgo: number
  risk: RiskLevel
  hoursMin: number
  hoursMax: number
  outcome?: Outcome // undefined = still active
}

// The tide measures time left on one shared scale: at 24h or more a buoy floats, at 0h it reaches the seabed.
export const HORIZON_H = 24

export const user = { name: 'Mang Ramon', initials: 'MR', place: 'Batangas City' }

// Placeholder data until the backend exists. Estimates only.
export const catches: Catch[] = [
  { id: '1', species: 'Tamban',         shape: 'sardine',  kg: 15, place: 'Batangas City', hoursAgo: 3,  risk: 'high',     hoursMin: 3,  hoursMax: 5 },
  { id: '2', species: 'Galunggong',     shape: 'scad',     kg: 12, place: 'Lemery',        hoursAgo: 18, risk: 'moderate', hoursMin: 8,  hoursMax: 12 },
  { id: '3', species: 'Tulingang bilog', shape: 'tuna',    kg: 9,  place: 'Balayan',       hoursAgo: 11, risk: 'moderate', hoursMin: 9,  hoursMax: 13 },
  { id: '4', species: 'Alumahan',       shape: 'mackerel', kg: 25, place: 'Calatagan',     hoursAgo: 26, risk: 'low',      hoursMin: 18, hoursMax: 24 },
  { id: '5', species: 'Gulyasan',       shape: 'tuna',     kg: 40, place: 'Balayan',       hoursAgo: 6,  risk: 'low',      hoursMin: 20, hoursMax: 30 },
  { id: '6', species: 'Tambakol',       shape: 'tuna',     kg: 8,  place: 'Balayan',       hoursAgo: 72, risk: 'low',      hoursMin: 0,  hoursMax: 0, outcome: 'sold' },
  { id: '7', species: 'Hiwas',          shape: 'moon',     kg: 6,  place: 'Lemery',        hoursAgo: 30, risk: 'moderate', hoursMin: 0,  hoursMax: 0, outcome: 'shared' },
  { id: '8', species: 'Matambaka',      shape: 'scad',     kg: 4,  place: 'Calatagan',     hoursAgo: 50, risk: 'high',     hoursMin: 0,  hoursMax: 0, outcome: 'lost' },
]

export const isActive = (c: Catch) => !c.outcome
export const byUrgency = (a: Catch, b: Catch) => a.hoursMin - b.hoursMin

// Placeholder tally for the week
export const weekOutcomes = {
  sold: { n: 7, kg: 96 },
  shared: { n: 2, kg: 18 },
  lost: { n: 1, kg: 6 },
}