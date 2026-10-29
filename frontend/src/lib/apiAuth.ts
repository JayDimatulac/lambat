import { api, ApiError, getToken, setToken } from './api'
import { initialsOf, shortName, type BuyerProfile, type BuyerType, type FisherProfile, type Role, type SessionUser, type Status } from './accounts'

type ApiUser = {
  id: string
  role: 'FISHERFOLK' | 'BUYER' | 'ADMIN' | 'ORGANIZATION'
  status: Status
  name: string
  mobile: string
  email: string | null
  barangay: string
  businessName: string | null
  buyerType: string | null
  statusNote: string | null
  profile: { fisher?: FisherProfile; buyer?: { address?: string } } | null
  createdAt: string
}

const ROLE_FROM_API: Record<ApiUser['role'], Role> = {
  FISHERFOLK: 'fisherfolk',
  BUYER: 'buyer',
  ADMIN: 'admin',
  ORGANIZATION: 'organization',
}

export function fromApiUser(u: ApiUser): SessionUser {
  const role = ROLE_FROM_API[u.role]
  return {
    id: u.id,
    role,
    status: u.status,
    name: u.name,
    mobile: u.mobile,
    email: u.email ?? undefined,
    barangay: u.barangay,
    createdAt: Date.parse(u.createdAt),
    fisher: role === 'fisherfolk' ? u.profile?.fisher : undefined,
    buyer:
      role === 'buyer'
        ? { businessName: u.businessName ?? '', buyerType: (u.buyerType as BuyerType) ?? 'market', address: u.profile?.buyer?.address ?? '' }
        : undefined,
    note: u.statusNote ?? undefined,
    initials: initialsOf(u.name).toUpperCase(),
    shortName: shortName(u.name),
  }
}

export type ApiLoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: 'creds' | 'suspended' | 'busy' | 'network' }

export async function apiLogin(identifier: string, password: string): Promise<ApiLoginResult> {
  try {
    const r = await api.post<{ token: string; user: ApiUser }>('/auth/login', { mobile: identifier, password })
    setToken(r.token)
    return { ok: true, user: fromApiUser(r.user) }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 0) return { ok: false, error: 'network' }
      if (e.status === 403) return { ok: false, error: 'suspended' }
      if (e.status === 429) return { ok: false, error: 'busy' }
    }
    return { ok: false, error: 'creds' }
  }
}

export type ApiRegisterInput = {
  role: 'fisherfolk' | 'buyer'
  name: string
  mobile: string
  barangay: string
  password: string
  email?: string
  fisher?: FisherProfile
  buyer?: BuyerProfile
}
export type ApiRegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: 'mobile_taken' | 'invalid' | 'busy' | 'network'; message: string }

export async function apiRegister(input: ApiRegisterInput): Promise<ApiRegisterResult> {
  const common = { name: input.name, mobile: input.mobile, barangay: input.barangay, password: input.password, email: input.email }
  const body =
    input.role === 'fisherfolk'
      ? {
          ...common,
          role: 'FISHERFOLK',
          boatOrGear: [input.fisher?.boat, ...(input.fisher?.gear ?? [])].filter(Boolean).join(', ') || undefined,
          fishingArea: input.fisher?.ground ?? undefined,
          profile: { fisher: input.fisher },
        }
      : {
          ...common,
          role: 'BUYER',
          businessName: input.buyer?.businessName,
          buyerType: input.buyer?.buyerType,
          profile: { buyer: { address: input.buyer?.address ?? '' } },
        }
  try {
    const r = await api.post<{ token: string; user: ApiUser }>('/auth/register', body)
    setToken(r.token)
    return { ok: true, user: fromApiUser(r.user) }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 0) return { ok: false, error: 'network', message: e.message }
      if (e.status === 429) return { ok: false, error: 'busy', message: e.message }
      if (e.status === 409) return { ok: false, error: 'mobile_taken', message: e.message }
      return { ok: false, error: 'invalid', message: e.message }
    }
    return { ok: false, error: 'invalid', message: 'Something went wrong' }
  }
}

// the saved session, if the token is still good
export async function apiMe(): Promise<SessionUser | null> {
  if (!getToken()) return null
  try {
    const r = await api.get<{ user: ApiUser }>('/auth/me')
    return fromApiUser(r.user)
  } catch {
    return null
  }
}

export async function apiReapply(buyer: BuyerProfile): Promise<SessionUser | null> {
  try {
    const r = await api.patch<{ user: ApiUser }>('/auth/reapply', {
      businessName: buyer.businessName,
      buyerType: buyer.buyerType,
      profile: { buyer: { address: buyer.address } },
    })
    return fromApiUser(r.user)
  } catch {
    return null
  }
}

export function apiLogout() {
  setToken(null)
}