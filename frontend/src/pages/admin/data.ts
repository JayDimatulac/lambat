export type Risk = 'low' | 'mod' | 'high' | 'crit'
export type Status = 'pend' | 'ok' | 'no'
export type Account = { name: string; type: string; town: string; needs: string; status: Status }
export type Ctx = { accounts: Account[]; setStatus: (i: number, s: Status) => void; toast: (t: string) => void }

export const KPIS: [string, string, string, '' | 'good' | 'loss'][] = [
  ['1,284', 'Rehistradong huli', '+112 ngayong linggo', ''],
  ['18.6 t', 'Kabuuang timbang', 'Registered quantity', ''],
  ['11.2 t', 'Naibenta', '60% ng kabuuan', 'good'],
  ['2.4 t', 'Na-redistribute', 'Sa 18 organisasyon', 'good'],
  ['1.9 t', 'Nasayang', '10% loss rate · bumaba ng 3 pts', 'loss'],
  ['₱412k', 'Halagang nabawi', 'Estimate', 'good'],
]
export const OUTCOME_NAMES = ['Naibenta', 'Na-redistribute', 'Na-process', 'Nasayang']
export const OUTCOME_COLORS = ['var(--color-teal)', '#2E8391', 'var(--color-peach)', 'var(--color-coral)']
export const WEEKS: { label: string; kg: number[] }[] = [
  ['Ago 10', [1100, 260, 120, 320]], ['Ago 17', [1180, 280, 140, 300]], ['Ago 24', [1240, 300, 130, 290]],
  ['Ago 31', [1320, 310, 160, 270]], ['Set 7', [1380, 330, 170, 250]], ['Set 14', [1450, 340, 180, 240]],
  ['Set 21', [1520, 360, 190, 230]], ['Set 28', [1610, 380, 210, 210]],
].map(([label, kg]) => ({ label: label as string, kg: kg as number[] }))
export const RISK: [Risk, number, string][] = [['low', 62, 'var(--color-risk-low-line)'], ['mod', 24, 'var(--color-risk-moderate-line)'], ['high', 11, 'var(--color-risk-high-line)'], ['crit', 3, 'var(--color-risk-critical-line)']]
export const SPECIES: [string, number][] = [['Tamban', 420], ['Galunggong', 350], ['Alumahan', 270], ['Bangus', 190], ['Pusit', 120]]
export const TOWNS: [string, number][] = [['Batangas City', 16], ['Lemery', 13], ['Calatagan', 9], ['Nasugbu', 7], ['Taal Lake', 4]]

export const ACCOUNTS: Account[] = [
  ['Ate Liza Santos', 'Buyer', 'Lemery', 'Bangus, galunggong · 50 kg/araw', 'pend'],
  ['Kuya Ben Dizon', 'Cooperative', 'Batangas City', 'Lahat ng uri · 300 kg/araw', 'pend'],
  ['Batangas Fish Port', 'Fish port', 'Batangas City', 'Market rate · walang limit', 'pend'],
  ['Bagsakan ng Nasugbu', 'Fish port', 'Nasugbu', 'Tamban, tuna · 500 kg/araw', 'pend'],
  ['Samahang Bukid-Dagat', 'Organization', 'Calatagan', 'Relief packs · 80 pamilya', 'pend'],
  ['Mang Tonyo Reyes', 'Buyer', 'Taal', 'Tilapia, maliputo · 40 kg/araw', 'pend'],
  ['Dried Fish Co-op ng Lian', 'Cooperative', 'Lian', 'Tuyo, bagoong · 120 kg/araw', 'pend'],
  ['Ate Mila Cruz', 'Buyer', 'Lemery', 'Pusit · 20 kg/araw', 'ok'],
  ['Barangay Wawa Kitchen', 'Organization', 'Batangas City', 'Community feeding · 60 pamilya', 'no'],
].map(([name, type, town, needs, status]) => ({ name, type, town, needs, status: status as Status }))

export const LISTINGS: { fish: string; qty: string; fisher: string; left: string; risk: Risk; type: string; status: string }[] = [
  ['Tamban', '15 kg', 'Mang Ramon · Batangas City', '3–5 hrs', 'high', 'Quick sale', 'Walang tugon'],
  ['Galunggong', '12 kg', 'Mang Ramon · Lemery', '8–12 hrs', 'mod', 'Find buyer', 'May 2 alok'],
  ['Alumahan', '30 kg', 'Ka Dado · Nasugbu', '< 1 hr', 'crit', 'Redistribute', 'Naghihintay ng org'],
  ['Bangus', '25 kg', 'Mang Ramon · Calatagan', '18–24 hrs', 'low', 'Find buyer', 'May 1 alok'],
  ['Tamban', '60 kg', 'Aling Nena · Lian', '2–4 hrs', 'high', 'Redistribute', 'Tinanggap ng org'],
  ['Pusit', '8 kg', 'Mang Ramon · Taal Lake', '—', 'low', 'Find buyer', 'Naibenta'],
].map(([fish, qty, fisher, left, risk, type, status]) => ({ fish, qty, fisher, left, risk: risk as Risk, type, status }))

export const SHELF_LIFE: string[][] = [
  ['Tamban', '4 h', '2 h', '1 h', 'Bagoong, tuyo'], ['Galunggong', '14 h', '8 h', '4 h', 'Tuyo, daing'],
  ['Bangus', '24 h', '14 h', '6 h', 'Tinapa, daing'], ['Pusit', '18 h', '10 h', '5 h', 'Pinatuyong pusit'],
  ['Tuna', '30 h', '16 h', '7 h', 'Tuna flakes'], ['Alumahan', '10 h', '6 h', '3 h', 'Tuyo, bagoong'],
]
export const SENT: [string, string, string, string][] = [
  ['Strong wind warning · Batangas Bay', 'Weather / sea condition', '214 SMS · 1,032 app', 'Ngayong 6:00 AM'],
  ['Mataas na alon · Calatagan coast', 'Weather / sea condition', '96 SMS · 410 app', 'Kahapon'],
  ['Presyo ng tamban bumaba ng ₱3/kg', 'Market update', '0 SMS · 880 app', '2 araw na ang nakaraan'],
]