import type { RiskLevel } from '../lib/risk'

export type Catch = {
  id: string
  species: string
  kg: number
  place: string
  ago: string
  risk: RiskLevel
  hoursMin: number
  hoursMax: number
  sold?: boolean
}

// Placeholder data until the backend exists. Estimates only.
export const catches: Catch[] = [
  { id: '1', species: 'Alumahan',   kg: 25, place: 'Calatagan',     ago: '26 oras na ang nakalipas', risk: 'low',      hoursMin: 18, hoursMax: 24 },
  { id: '2', species: 'Galunggong', kg: 12, place: 'Lemery',        ago: '18 oras na ang nakalipas', risk: 'moderate', hoursMin: 8,  hoursMax: 12 },
  { id: '3', species: 'Tamban',     kg: 15, place: 'Batangas City', ago: '3 oras na ang nakalipas',  risk: 'high',     hoursMin: 3,  hoursMax: 5 },
  { id: '4', species: 'Tambakol',   kg: 8,  place: 'Balayan',       ago: '3 araw na ang nakalipas',  risk: 'low',      hoursMin: 0,  hoursMax: 0, sold: true },
]