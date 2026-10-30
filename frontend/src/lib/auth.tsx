import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Account, BuyerProfile, NewAccount, SessionUser, Status } from './accounts'
import { getToken } from './api'
import { apiAdminUsers, apiLogin, apiLogout, apiMe, apiReapply, apiRegister, apiSetStatus } from './apiAuth'

// Who is signed in. Login, register and the session go through the backend (see apiAuth.ts).
type LoginOutcome =
  | { ok: true; user: SessionUser }
  | { ok: false; error: 'creds' | 'rejected' | 'suspended' | 'busy' | 'network' }
type RegisterOutcome =
  | { ok: true; user: SessionUser; signedIn: boolean }
  | { ok: false; error: 'mobile_taken' | 'not_allowed' | 'invalid' | 'busy' | 'network'; message?: string }

type Ctx = {
  user: SessionUser | null
  accounts: Account[] // everyone, for the admin screen (empty for other roles)
  login: (identifier: string, password: string) => Promise<LoginOutcome>
  register: (input: Omit<NewAccount, 'status'>) => Promise<RegisterOutcome>
  logout: () => void
  setStatus: (id: string, status: Status, note?: string) => void
  resubmit: (profile: BuyerProfile) => void // a buyer who was not approved applies again
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<SessionUser | null>(null)
  const [adminList, setAdminList] = useState<Account[]>([])
  const [ready, setReady] = useState(false)
  const started = useRef(false)

  // pick up a saved session (kept per tab) if its token is still good
  useEffect(() => {
    if (started.current) return
    started.current = true
    apiMe().then((u) => {
      setMe(u)
      setReady(true)
    })
  }, [])

  // an expired or invalid token (api.ts announces it): back to the login
  useEffect(() => {
    const onLogout = () => {
      setMe(null)
      setAdminList([])
    }
    window.addEventListener('lambat:logout', onLogout)
    return () => window.removeEventListener('lambat:logout', onLogout)
  }, [])

  // someone suspended while signed in is signed out by the server (401 on the next request).
  // A buyer who was not approved stays in, to read why and to apply again.
  const user = useMemo(() => {
    const ok = !!me && (me.status === 'ACTIVE' || me.status === 'PENDING' || (me.status === 'REJECTED' && me.role === 'buyer'))
    return ok ? me : null
  }, [me])

  const refresh = useCallback(async () => {
    if (!getToken()) return
    const fresh = await apiMe()
    if (fresh) setMe(fresh) // a failed request keeps what we have; a real 401 logs out through the event
  }, [])

  // a buyer waiting for approval (or not approved) sees the admin's decision without logging in again
  const waiting = !!user && user.status !== 'ACTIVE'
  useEffect(() => {
    if (!waiting) return
    const id = setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', refresh)
    }
  }, [waiting, refresh])

  const isAdmin = user?.role === 'admin'
  const loadAdminList = useCallback(async () => {
    const list = await apiAdminUsers()
    if (list) setAdminList(list)
  }, [])
  useEffect(() => {
    if (!isAdmin) return
    loadAdminList()
    const id = setInterval(loadAdminList, 30_000)
    return () => clearInterval(id)
  }, [isAdmin, loadAdminList])

  const accounts = useMemo(() => (isAdmin ? adminList : []), [isAdmin, adminList])

  const login = useCallback<Ctx['login']>(async (identifier, password) => {
    const res = await apiLogin(identifier, password)
    if (!res.ok) return res
    setMe(res.user)
    return res
  }, [])

  const register = useCallback<Ctx['register']>(async (input) => {
    if (input.role !== 'fisherfolk' && input.role !== 'buyer') return { ok: false, error: 'not_allowed' }
    const res = await apiRegister({
      role: input.role,
      name: input.name,
      mobile: input.mobile,
      barangay: input.barangay,
      password: input.password,
      email: input.email,
      fisher: input.fisher,
      buyer: input.buyer,
    })
    if (!res.ok) return res
    const signedIn = res.user.status === 'ACTIVE' // buyers wait for approval and sign in later
    if (signedIn) setMe(res.user)
    else apiLogout()
    return { ok: true, user: res.user, signedIn }
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setMe(null)
    setAdminList([])
  }, [])

  // only an admin may change who is approved (the server enforces this too)
  const setStatus = useCallback(
    (id: string, status: Status, note?: string) => {
      if (user?.role !== 'admin') return
      setAdminList((prev) =>
        prev.map((a) => (a.id === id && a.role !== 'admin' ? { ...a, status, note: status === 'REJECTED' ? note : undefined } : a)),
      )
      // show the change at once, then reload so a refused change snaps back
      apiSetStatus(id, status, note).then(() => loadAdminList())
    },
    [user, loadAdminList],
  )

  // a rejected buyer fixes the details and goes back to the waiting line
  const resubmit = useCallback(
    (profile: BuyerProfile) => {
      if (user?.role !== 'buyer' || user.status !== 'REJECTED') return
      apiReapply(profile).then((u) => {
        if (u) setMe(u)
      })
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, accounts, login, register, logout, setStatus, resubmit }),
    [user, accounts, login, register, logout, setStatus, resubmit],
  )

  if (!ready) return <div className="bg-dawn min-h-dvh" aria-busy="true" />
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}

// For screens that only exist behind a login: the person is always there
export function useUser(): SessionUser {
  const { user } = useAuth()
  if (!user) throw new Error('useUser needs a signed-in person')
  return user
}