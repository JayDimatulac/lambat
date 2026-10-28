import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ACCOUNTS_KEY, SESSION_KEY, browserStore as store, sessionStore, checkLogin, loadAccounts, registerAccount, saveAccounts, seedAccounts, toSession,
  type Account, type BuyerProfile, type NewAccount, type SessionUser, type Status,
} from './accounts'

// Who is signed in. Today this reads and writes the browser (see accounts.ts).
// When the backend exists, login, register and logout become requests to it and nothing else here changes.
type LoginOutcome = { ok: true; user: SessionUser } | { ok: false; error: 'creds' | 'rejected' | 'suspended' }
type RegisterOutcome = { ok: true; user: SessionUser; signedIn: boolean } | { ok: false; error: 'mobile_taken' | 'not_allowed' }

type Ctx = {
  user: SessionUser | null
  accounts: Account[] // everyone, for the admin screen
  login: (identifier: string, password: string) => Promise<LoginOutcome>
  register: (input: Omit<NewAccount, 'status'>) => Promise<RegisterOutcome>
  logout: () => void
  setStatus: (id: string, status: Status, note?: string) => void
  resubmit: (profile: BuyerProfile) => void // a buyer who was not approved applies again
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      let list = loadAccounts(store)
      // add any demo account that is missing, so an old saved list can never lock out the admin
      const seeds = await seedAccounts()
      const missing = seeds.filter((s) => !list.some((a) => (s.mobile && a.mobile === s.mobile) || (s.username && a.username === s.username)))
      if (missing.length) {
        list = [...list, ...missing]
        saveAccounts(store, list)
      }
      setAccounts(list)
      store.remove(SESSION_KEY) // clears the old long-lived session saved by earlier versions
      setSessionId(sessionStore.get(SESSION_KEY))
      setReady(true)
    })()
  }, [])

  // someone who is rejected or suspended while signed in is signed out on the spot
  // another tab (for example the admin approving a buyer) changed the accounts: pick it up live
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === ACCOUNTS_KEY) setAccounts(loadAccounts(store)) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // someone who is suspended (or a non-buyer who is rejected) while signed in is signed out on the spot.
  // A buyer who was not approved stays in, to read why and to apply again.
  const user = useMemo(() => {
    const a = accounts.find((x) => x.id === sessionId)
    const ok = a && (a.status === 'ACTIVE' || a.status === 'PENDING' || (a.status === 'REJECTED' && a.role === 'buyer'))
    return a && ok ? toSession(a) : null
  }, [accounts, sessionId])

  const signIn = useCallback((id: string) => {
    sessionStore.set(SESSION_KEY, id)
    setSessionId(id)
  }, [])

  const login = useCallback<Ctx['login']>(async (identifier, password) => {
    const res = await checkLogin(accounts, identifier, password)
    if (!res.ok) return res
    signIn(res.account.id)
    return { ok: true, user: toSession(res.account) }
  }, [accounts, signIn])

  const register = useCallback<Ctx['register']>(async (input) => {
    const res = await registerAccount(accounts, input)
    if (!res.ok) return res
    const next = [...accounts, res.account]
    saveAccounts(store, next)
    setAccounts(next)
    const signedIn = res.account.status === 'ACTIVE' // buyers wait for approval and sign in later
    if (signedIn) signIn(res.account.id)
    return { ok: true, user: toSession(res.account), signedIn }
  }, [accounts, signIn])

  const logout = useCallback(() => {
    sessionStore.remove(SESSION_KEY)
    setSessionId(null)
  }, [])

  // only an admin may change who is approved (the real rule is enforced on the server)
  const setStatus = useCallback((id: string, status: Status, note?: string) => {
    if (user?.role !== 'admin') return
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id && a.role !== 'admin' ? { ...a, status, note: status === 'REJECTED' ? note : undefined } : a))
      saveAccounts(store, next)
      return next
    })
  }, [user])

  // a rejected buyer fixes the details and goes back to the waiting line
  const resubmit = useCallback((profile: BuyerProfile) => {
    if (user?.role !== 'buyer' || user.status !== 'REJECTED') return
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === user.id ? { ...a, status: 'PENDING' as const, note: undefined, buyer: profile } : a))
      saveAccounts(store, next)
      return next
    })
  }, [user])

  const value = useMemo(() => ({ user, accounts, login, register, logout, setStatus, resubmit }), [user, accounts, login, register, logout, setStatus, resubmit])

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