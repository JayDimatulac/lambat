import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Catch, Outcome, Shape } from './mock'
import { SPECIES } from '../lib/species'
import { remaining, riskFor, type Model } from '../lib/estimator'
import type { RiskLevel } from '../lib/risk'

const HOUR = 3_600_000

type Stored = {
  id: string
  species: string
  speciesId?: string
  shape: Shape
  kg: number
  place: string
  caughtAt: number
  model?: Model
  outcome?: Outcome
  closedRisk?: RiskLevel
  closedAt?: number
}
export type NewCatch = { species: string; speciesId?: string; shape: Shape; kg: number; place: string; caughtAt: number; model: Model }

// Placeholder catches until the backend exists. Each is [hours ago, total kg of ice from then on].
function seeds(now: number): Stored[] {
  const live = (id: string, species: string, shape: Shape, kg: number, place: string, speciesId: string, events: [number, number][]): Stored => {
    const sp = SPECIES[speciesId]
    return {
      id, species, speciesId, shape, kg, place,
      caughtAt: now - events[0][0] * HOUR,
      model: { l0Min: sp.l0Min, l0Max: sp.l0Max, histamine: !!sp.histamine, kg, events: events.map(([ago, iceKg]) => ({ at: now - ago * HOUR, iceKg })) },
    }
  }
  const closed = (id: string, species: string, shape: Shape, kg: number, place: string, hoursAgo: number, outcome: Outcome, closedRisk: RiskLevel): Stored => ({
    id, species, shape, kg, place, caughtAt: now - hoursAgo * HOUR, outcome, closedRisk, closedAt: now - (hoursAgo - 2) * HOUR,
  })
  return [
    live('s1', 'Tamban', 'sardine', 15, 'Batangas City', 'bali', [[3, 0]]),
    live('s2', 'Galunggong', 'scad', 12, 'Lemery', 'roughear', [[4, 0]]),
    live('s3', 'Tulingang bilog', 'tuna', 9, 'Balayan', 'bullet', [[9, 2]]),
    live('s4', 'Alumahan', 'mackerel', 25, 'Calatagan', 'islandMackerel', [[20, 10], [8, 25]]),
    live('s5', 'Gulyasan', 'tuna', 40, 'Balayan', 'skipjack', [[6, 40]]),
    closed('s6', 'Tambakol', 'tuna', 8, 'Balayan', 72, 'sold', 'low'),
    closed('s7', 'Hiwas', 'moon', 6, 'Lemery', 30, 'shared', 'moderate'),
    closed('s8', 'Matambaka', 'scad', 4, 'Calatagan', 50, 'lost', 'high'),
  ]
}

function derive(s: Stored, now: number): Catch {
const base = { id: s.id, species: s.species, speciesId: s.speciesId, shape: s.shape, kg: s.kg, place: s.place, caughtAt: s.caughtAt, hoursAgo: Math.max(0, Math.round((now - s.caughtAt) / HOUR)) }
  if (s.outcome || !s.model) {
    return { ...base, risk: s.closedRisk ?? 'low', hoursMin: 0, hoursMax: 0, minsMin: 0, minsMax: 0, outcome: s.outcome, closedAt: s.closedAt }
  }
  const { leftMin, leftMax } = remaining(s.model, now)
  const hoursMin = Math.floor(leftMin + 0.1)
  return {
    ...base,
    model: s.model,
    risk: riskFor((leftMin + leftMax) / 2),
    hoursMin,
    hoursMax: Math.max(hoursMin, Math.ceil(leftMax - 0.1)),
    minsMin: Math.floor(leftMin * 60),
    minsMax: Math.floor(leftMax * 60),
  }
}

const keyFor = (userId: string) => `lambat.catches.v3.${userId}` // each account keeps its own catches on this phone
function load(key: string): Stored[] | null {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null')
    return Array.isArray(raw) ? raw : null
  } catch {
    return null
  }
}

type Ctx = {
  catches: Catch[]
  addCatch: (c: NewCatch) => string
  addIce: (id: string, kg: number) => void
  setOutcome: (id: string, outcome: Outcome | null) => void
  resetDemo: () => void
}
const CatchesCtx = createContext<Ctx | null>(null)

// demo = the demo fisher starts with sample catches. Everyone else starts with an empty list.
export function CatchesProvider({ children, userId, demo }: { children: ReactNode; userId: string; demo: boolean }) {
  const key = keyFor(userId)
  const [list, setList] = useState<Stored[]>(() => load(key) ?? (demo ? seeds(Date.now()) : []))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // everything is kept in this browser until the backend exists
  useEffect(() => {
       try { localStorage.setItem(key, JSON.stringify(list)) } catch { /* storage can be blocked */ }
  }, [list, key])

  const catches = useMemo(() => list.map((s) => derive(s, now)), [list, now])

  const addCatch = useCallback((c: NewCatch) => {
    const id = `c${Date.now().toString(36)}`
    setList((prev) => [{ ...c, id }, ...prev])
    setNow(Date.now())
    return id
  }, [])

  const addIce = useCallback((id: string, kg: number) => {
    const at = Date.now()
    setList((prev) =>
      prev.map((s) => {
        if (s.id !== id || !s.model) return s
        const last = s.model.events[s.model.events.length - 1].iceKg
        return { ...s, model: { ...s.model, events: [...s.model.events, { at, iceKg: last + kg }] } }
      }),
    )
    setNow(at)
  }, [])

  const setOutcome = useCallback((id: string, outcome: Outcome | null) => {
    const at = Date.now()
    setList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        if (!outcome) return { ...s, outcome: undefined, closedRisk: undefined, closedAt: undefined }
        return { ...s, outcome, closedRisk: derive(s, at).risk, closedAt: at }
      }),
    )
    setNow(at)
  }, [])

  const resetDemo = useCallback(() => {
        setList(demo ? seeds(Date.now()) : [])
    setNow(Date.now())
  }, [demo])

  const value = useMemo(() => ({ catches, addCatch, addIce, setOutcome, resetDemo }), [catches, addCatch, addIce, setOutcome, resetDemo])
  return <CatchesCtx.Provider value={value}>{children}</CatchesCtx.Provider>
}

export function useCatches() {
  const v = useContext(CatchesCtx)
  if (!v) throw new Error('useCatches must be used inside <CatchesProvider>')
  return v
}