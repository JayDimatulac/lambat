export type Risk = 'low' | 'mod' | 'high' | 'crit'
export type ListingType = 'Find buyer' | 'Quick sale' | 'Redistribute'
export type AdvisoryType = 'Weather / sea condition' | 'Spoilage alert' | 'Market update'
export type Place = 'Batangas Bay' | 'Calatagan coast' | 'Taal Lake' | 'All Batangas'
export type Sev = 'calm' | 'watch' | 'warning'
export type Draft = { text: string; type: AdvisoryType; place: Place; sev: Sev }
export type Ctx = { toast: (msg: string) => void }

export const RISK_ORDER: Record<Risk, number> = { crit: 0, high: 1, mod: 2, low: 3 }

export type Kpi = { value: string; label: string; sub: string; tone: '' | 'good' | 'loss'; icon: 'fish' | 'scale' | 'sold' | 'shared' | 'lost' | 'coin' }
export const KPIS: Kpi[] = [
  { value: '1,284', label: 'Catches logged', sub: '+112 this week', tone: '', icon: 'fish' },
  { value: '18.6 t', label: 'Total weight', sub: 'Registered quantity', tone: '', icon: 'scale' },
  { value: '11.2 t', label: 'Sold', sub: '60% of the total', tone: 'good', icon: 'sold' },
  { value: '2.4 t', label: 'Redistributed', sub: 'To 18 organizations', tone: 'good', icon: 'shared' },
  { value: '1.9 t', label: 'Lost', sub: '10% loss rate, down 3 pts', tone: 'loss', icon: 'lost' },
  { value: '₱412k', label: 'Value recovered', sub: 'Estimate', tone: 'good', icon: 'coin' },
]

export const OUTCOMES = [
  { name: 'Sold', color: '#2e8391', tons: 11.2, note: 'Sold to buyers at the pier and the market.' },
  { name: 'Redistributed', color: '#94c1c9', tons: 2.4, note: 'Handed to 18 organizations.' },
  { name: 'Processed', color: '#f2b893', tons: 3.1, note: 'Turned into tuyo, daing and tinapa.' },
  { name: 'Lost', color: '#e8735a', tons: 1.9, note: '10% loss rate, down 3 points.' },
]
export const SEASON = { catches: '1,284', thisWeek: '+112 this week', value: '₱412k' }

export const WEEKS: { label: string; kg: number[] }[] = [
  { label: 'Aug 10', kg: [1100, 260, 120, 320] }, { label: 'Aug 17', kg: [1180, 280, 140, 300] },
  { label: 'Aug 24', kg: [1240, 300, 130, 290] }, { label: 'Aug 31', kg: [1320, 310, 160, 270] },
  { label: 'Sep 7', kg: [1380, 330, 170, 250] }, { label: 'Sep 14', kg: [1450, 340, 180, 240] },
  { label: 'Sep 21', kg: [1520, 360, 190, 230] }, { label: 'Sep 28', kg: [1610, 380, 210, 210] },
]
export const RISK_MIX: [Risk, number, string][] = [
  ['low', 62, 'var(--color-risk-low-line)'], ['mod', 24, 'var(--color-risk-moderate-line)'],
  ['high', 11, 'var(--color-risk-high-line)'], ['crit', 3, 'var(--color-risk-critical-line)'],
]
export const SPECIES: [string, number][] = [['Tamban', 420], ['Galunggong', 350], ['Alumahan', 270], ['Bangus', 190], ['Pusit', 120]]
export const TOWNS: [string, number][] = [['Batangas City', 16], ['Lemery', 13], ['Calatagan', 9], ['Nasugbu', 7], ['Taal Lake', 4]]

export type Listing = { id: number; fish: string; kg: number; fisher: string; town: string; left: string; risk: Risk; type: ListingType; status: string }
export const LISTINGS: Listing[] = [
  { id: 1, fish: 'Tamban', kg: 15, fisher: 'Mang Ramon', town: 'Batangas City', left: '3–5 hrs', risk: 'high', type: 'Quick sale', status: 'No response' },
  { id: 2, fish: 'Galunggong', kg: 12, fisher: 'Mang Ramon', town: 'Lemery', left: '8–12 hrs', risk: 'mod', type: 'Find buyer', status: '2 offers' },
  { id: 3, fish: 'Alumahan', kg: 30, fisher: 'Ka Dado', town: 'Nasugbu', left: '< 1 hr', risk: 'crit', type: 'Redistribute', status: 'Waiting for an organization' },
  { id: 4, fish: 'Bangus', kg: 25, fisher: 'Mang Ramon', town: 'Calatagan', left: '18–24 hrs', risk: 'low', type: 'Find buyer', status: '1 offer' },
  { id: 5, fish: 'Tamban', kg: 60, fisher: 'Aling Nena', town: 'Lian', left: '2–4 hrs', risk: 'high', type: 'Redistribute', status: 'Accepted by an organization' },
  { id: 6, fish: 'Pusit', kg: 8, fisher: 'Mang Ramon', town: 'Taal Lake', left: '—', risk: 'low', type: 'Find buyer', status: 'Sold' },
]
export const LISTING_TYPES: ListingType[] = ['Find buyer', 'Quick sale', 'Redistribute']

export const SHELF_LIFE: { fish: string; full: number; light: number; none: number; value: string }[] = [
  { fish: 'Tamban', full: 4, light: 2, none: 1, value: 'Bagoong, tuyo' },
  { fish: 'Galunggong', full: 14, light: 8, none: 4, value: 'Tuyo, daing' },
  { fish: 'Bangus', full: 24, light: 14, none: 6, value: 'Tinapa, daing' },
  { fish: 'Pusit', full: 18, light: 10, none: 5, value: 'Dried squid' },
  { fish: 'Tuna', full: 30, light: 16, none: 7, value: 'Tuna flakes' },
  { fish: 'Alumahan', full: 10, light: 6, none: 3, value: 'Tuyo, bagoong' },
]

export const ADVISORY_TYPES: AdvisoryType[] = ['Weather / sea condition', 'Spoilage alert', 'Market update']
export const PLACES: Place[] = ['Batangas Bay', 'Calatagan coast', 'Taal Lake', 'All Batangas']
export const REACH: Record<Place, number> = { 'Batangas Bay': 1246, 'Calatagan coast': 506, 'Taal Lake': 388, 'All Batangas': 2140 }
export const TEMPLATES: Record<AdvisoryType, string[]> = {
  'Weather / sea condition': ['Strong wind until 6:00 PM. Stay near shore. For planning only.', 'High waves expected this afternoon. Check the sea before you leave.'],
  'Spoilage alert': ['Hot day ahead. Add ice early to keep your catch fresh.', 'Catch is spoiling fast. Sell or hand over within the hour.'],
  'Market update': ['Tamban price dropped by ₱3/kg at the pier today.', 'Buyers at the pier are asking for galunggong this morning.'],
}

export type Sent = { title: string; meta: string; reach: string; when: string; sev: Sev }
export const SENT: Sent[] = [
  { title: 'Strong wind warning for Batangas Bay', meta: 'Weather / sea condition · Batangas Bay', reach: '214 SMS · 1,032 app', when: 'Today, 6:00 AM', sev: 'warning' },
  { title: 'High waves along the Calatagan coast', meta: 'Weather / sea condition · Calatagan coast', reach: '96 SMS · 410 app', when: 'Yesterday', sev: 'watch' },
  { title: 'Tamban price dropped by ₱3/kg', meta: 'Market update · All Batangas', reach: '0 SMS · 880 app', when: '2 days ago', sev: 'calm' },
]