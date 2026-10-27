import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  SESSION_KEY, browserStore as store, checkLogin, loadAccounts, registerAccount, saveAccounts, seedAccounts, toSession,
  type Account, type NewAccount, type SessionUser, type Status,
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
  setStatus: (id: string, status: Status) => void
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
      if (list.length === 0) {
        list = await seedAccounts()
        saveAccounts(store, list)
      }
      setAccounts(list)
      setSessionId(store.get(SESSION_KEY))
      setReady(true)
    })()
  }, [])

  // someone who is rejected or suspended while signed in is signed out on the spot
  const user = useMemo(() => {
    const a = accounts.find((x) => x.id === sessionId)
    return a && (a.status === 'ACTIVE' || a.status === 'PENDING') ? toSession(a) : null
  }, [accounts, sessionId])

  const signIn = useCallback((id: string) => {
    store.set(SESSION_KEY, id)
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
    store.remove(SESSION_KEY)
    setSessionId(null)
  }, [])

  // only an admin may change who is approved (the real rule is enforced on the server)
  const setStatus = useCallback((id: string, status: Status) => {
    if (user?.role !== 'admin') return
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id && a.role !== 'admin' ? { ...a, status } : a))
      saveAccounts(store, next)
      return next
    })
  }, [user])

  const value = useMemo(() => ({ user, accounts, login, register, logout, setStatus }), [user, accounts, login, register, logout, setStatus])

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