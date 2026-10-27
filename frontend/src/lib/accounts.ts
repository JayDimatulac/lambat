// Accounts, roles and passwords for LAMBAT.
//
// DEMO ONLY: this runs in the browser, so anyone with the phone can read it. It exists so every screen and rule
// can be shown before the backend is ready. The real version lives on the server: bcrypt for passwords, tokens
// in secure cookies, and the role and PENDING rules enforced there. Nothing in the browser can be trusted.

export type Role = 'fisherfolk' | 'buyer' | 'organization' | 'admin'
export type Status = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
export type Boat = 'motor' | 'paddle' | 'shore'
export type Gear = 'net' | 'line' | 'trap' | 'other'
export type Ground = 'near' | 'open'
export type BuyerType = 'market' | 'trader' | 'restaurant' | 'smokehouse'

export type FisherProfile = { boat: Boat | null; gear: Gear[]; ground: Ground | null; landing: string }
export type BuyerProfile = { businessName: string; buyerType: BuyerType; address: string }

export type Account = {
  id: string
  role: Role
  status: Status
  name: string
  mobile: string // 09XXXXXXXXX, empty for accounts that sign in with a username
  username?: string
  email?: string
  barangay: string
  salt: string
  hash: string
  createdAt: number
  demo?: boolean
  fisher?: FisherProfile
  buyer?: BuyerProfile
}

export type SessionUser = Omit<Account, 'salt' | 'hash'> & { initials: string; shortName: string }

// Where each role lands after login
export const ROLE_HOME: Record<Role, string> = { fisherfolk: '/home', buyer: '/buyer', organization: '/org', admin: '/admin' }

/* ---------- names ---------- */
const HONORIFICS = ['mang', 'aling', 'ate', 'kuya', 'tatay', 'nanay', 'ka', 'mam', 'sir']
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 1 && HONORIFICS.includes(parts[0].toLowerCase())) return `${parts[0]} ${parts[1]}`
  return parts[0] ?? ''
}
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')
}
export const toSession = (a: Account): SessionUser => {
  const { salt: _salt, hash: _hash, ...rest } = a
  void _salt
  void _hash
  return { ...rest, initials: initialsOf(a.name).toUpperCase(), shortName: shortName(a.name) }
}

/* ---------- checks ---------- */
// 09171234567, 0917 123 4567, +63 917 123 4567 and 63917... all become 09171234567
export function normalizeMobile(input: string): string | null {
  let m = input.replace(/[\s-]/g, '')
  if (m.startsWith('+63')) m = `0${m.slice(3)}`
  else if (m.startsWith('63') && m.length === 12) m = `0${m.slice(2)}`
  return /^09\d{9}$/.test(m) ? m : null
}
export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

/* ---------- passwords ---------- */
const newSalt = () => {
  const bytes = new Uint8Array(12)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Pages opened over plain http (like a phone on your wifi) have no crypto.subtle. A weak stand-in, demo only.
  let h = 5381
  for (const b of data) h = ((h << 5) + h + b) | 0
  return `x${(h >>> 0).toString(16)}`
}

/* ---------- storage ---------- */
export type Store = { get: (k: string) => string | null; set: (k: string, v: string) => void; remove: (k: string) => void }
export const browserStore: Store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage can be blocked */ } },
  remove: (k) => { try { localStorage.removeItem(k) } catch { /* storage can be blocked */ } },
}
export const ACCOUNTS_KEY = 'lambat.accounts.v1'
export const SESSION_KEY = 'lambat.session.v1'

export function loadAccounts(store: Store): Account[] {
  try {
    const raw = JSON.parse(store.get(ACCOUNTS_KEY) ?? 'null')
    return Array.isArray(raw) ? raw.filter((a) => a && typeof a.id === 'string' && typeof a.hash === 'string') : []
  } catch {
    return []
  }
}
export const saveAccounts = (store: Store, list: Account[]) => store.set(ACCOUNTS_KEY, JSON.stringify(list))

/* ---------- making accounts ---------- */
export type NewAccount = Omit<Account, 'id' | 'salt' | 'hash' | 'createdAt'> & { password: string }

export async function makeAccount(input: NewAccount): Promise<Account> {
  const { password, ...rest } = input
  const salt = newSalt()
  return { ...rest, id: `u${Date.now().toString(36)}${salt.slice(0, 4)}`, salt, hash: await hashPassword(password, salt), createdAt: Date.now() }
}

// The rules for who may sign up by themselves. Admin and organization accounts are never created here.
export function selfRegisterStatus(role: Role): Status | null {
  if (role === 'fisherfolk') return 'ACTIVE' // no barriers for the people the app is for
  if (role === 'buyer') return 'PENDING' // an admin must approve, so fake buyers cannot contact fisherfolk
  return null
}

export type RegisterResult = { ok: true; account: Account } | { ok: false; error: 'mobile_taken' | 'not_allowed' }
export async function registerAccount(list: Account[], input: Omit<NewAccount, 'status'>): Promise<RegisterResult> {
  const status = selfRegisterStatus(input.role)
  if (!status) return { ok: false, error: 'not_allowed' }
  if (list.some((a) => a.mobile && a.mobile === input.mobile)) return { ok: false, error: 'mobile_taken' }
  return { ok: true, account: await makeAccount({ ...input, status }) }
}

export type LoginResult = { ok: true; account: Account } | { ok: false; error: 'creds' | 'rejected' | 'suspended' }
export async function checkLogin(list: Account[], identifier: string, password: string): Promise<LoginResult> {
  const mobile = normalizeMobile(identifier)
  const username = identifier.trim().toLowerCase()
  const account = list.find((a) => (mobile && a.mobile === mobile) || (!!a.username && a.username === username))
  // the same answer for "no such account" and "wrong password", so nobody can probe for numbers
  if (!account || (await hashPassword(password, account.salt)) !== account.hash) return { ok: false, error: 'creds' }
  if (account.status === 'REJECTED') return { ok: false, error: 'rejected' }
  if (account.status === 'SUSPENDED') return { ok: false, error: 'suspended' }
  return { ok: true, account }
}

/* ---------- demo accounts, so every role can be shown ---------- */
export const DEMO_LOGINS = [
  { key: 'fisher', id: '09171234567', password: 'isda1234' },
  { key: 'buyer', id: '09181234567', password: 'bili1234' },
  { key: 'admin', id: 'admin', password: 'admin1234' },
] as const

export async function seedAccounts(): Promise<Account[]> {
  const base = { email: undefined, barangay: '' }
  return Promise.all([
    makeAccount({ ...base, role: 'fisherfolk', status: 'ACTIVE', name: 'Mang Ramon', mobile: '09171234567', barangay: 'Calan', demo: true, password: 'isda1234',
      fisher: { boat: 'motor', gear: ['net'], ground: 'near', landing: 'Balayan' } }),
    makeAccount({ ...base, role: 'buyer', status: 'PENDING', name: 'Berto Magsino', mobile: '09181234567', barangay: 'Poblacion', password: 'bili1234',
      buyer: { businessName: 'Berto’s Fish Stall', buyerType: 'market', address: 'Balayan Public Market' } }),
    makeAccount({ ...base, role: 'buyer', status: 'PENDING', name: 'Liza Mendoza', mobile: '09191234567', barangay: 'Calatagan', password: 'bili1234',
      buyer: { businessName: 'Liza’s Dried Fish', buyerType: 'trader', address: 'Calatagan Pier' } }),
    makeAccount({ ...base, role: 'admin', status: 'ACTIVE', name: 'LAMBAT Admin', mobile: '', username: 'admin', barangay: '—', password: 'admin1234' }),
  ])
}