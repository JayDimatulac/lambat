import type { RiskLevel } from '../lib/risk'

export type Catch = {
  id: string
  species: string
  kg: number
  place: string
  ago: string
  risk: RiskLevel
  remaining: string
  sold?: boolean
}

// Placeholder data until the backend exists. Estimates only.
export const catches: Catch[] = [
  { id: '1', species: 'Bangus',     kg: 25, place: 'Calatagan',     ago: '1d 2h ago', risk: 'low',      remaining: '18–24 hrs' },
  { id: '2', species: 'Galunggong', kg: 12, place: 'Lemery',        ago: '18h ago',   risk: 'moderate', remaining: '8–12 hrs' },
  { id: '3', species: 'Tamban',     kg: 15, place: 'Batangas City', ago: '3h ago',    risk: 'high',     remaining: '3–5 hrs' },
  { id: '4', species: 'Pusit',      kg: 8,  place: 'Taal Lake',     ago: '3d ago',    risk: 'low',      remaining: '', sold: true },
]
