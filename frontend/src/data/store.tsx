import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Catch, Outcome, Shape } from './mock'
import { SPECIES, TILES } from '../lib/species'
import { remaining, riskFor, type Model } from '../lib/estimator'
import type { RiskLevel } from '../lib/risk'
import { api, ApiError } from '../lib/api'

const HOUR = 3_600_000

type Stored = {
  id: string
  species: string
  speciesId?: string // the species code, like 'bali'
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
export type AddResult = { ok: true; id: string } | { ok: false; message: string }

/* ---------- what the server sends ---------- */
type ApiCatch = {
  id: string
  kilos: number
  place: string | null
  caughtAt: string
  status: 'ACTIVE' | 'SOLD' | 'REDISTRIBUTED' | 'PROCESSED' | 'DISCARDED'
  closedAt: string | null
  closedRisk: string | null
  species: { id: string; code: string | null; englishName: string; l0Min: number | null; l0Max: number | null; histamine: boolean }
  iceEvents: { at: string; iceKg: number }[]
}
type ApiSpecies = { id: string; code: string | null }

const OUTCOME_FROM_API = {
  SOLD: 'sold',
  REDISTRIBUTED: 'shared',
  DISCARDED: 'lost',
  PROCESSED: 'sold', // the app has no "processed" outcome yet
} as const satisfies Record<string, Outcome>
const OUTCOME_TO_API: Record<Outcome, 'SOLD' | 'REDISTRIBUTED' | 'DISCARDED'> = { sold: 'SOLD', shared: 'REDISTRIBUTED', lost: 'DISCARDED' }
const RISKS: RiskLevel[] = ['low', 'moderate', 'high', 'critical']

function fromApi(c: ApiCatch): Stored {
  const code = c.species.code ?? undefined
  const tile = TILES.find((t) => !!code && t.members.includes(code))
  const fallback = code ? SPECIES[code] : undefined // used only if the server has no hours for this species
  const l0Min = c.species.l0Min ?? fallback?.l0Min
  const l0Max = c.species.l0Max ?? fallback?.l0Max
  const events = c.iceEvents.map((e) => ({ at: Date.parse(e.at), iceKg: e.iceKg }))
  return {
    id: c.id,
    species: tile?.name ?? 'Other',
    speciesId: code === 'other' ? undefined : code,
    shape: tile?.shape ?? 'scad',
    kg: c.kilos,
    place: c.place ?? '',
    caughtAt: Date.parse(c.caughtAt),
    model: l0Min && l0Max && events.length ? { l0Min, l0Max, histamine: c.species.histamine, kg: c.kilos, events } : undefined,
    outcome: c.status === 'ACTIVE' ? undefined : OUTCOME_FROM_API[c.status],
    closedRisk: RISKS.includes(c.closedRisk as RiskLevel) ? (c.closedRisk as RiskLevel) : undefined,
    closedAt: c.closedAt ? Date.parse(c.closedAt) : undefined,
  }
}

function derive(s: Stored, now: number): Catch {
  const base = {
    id: s.id,
    species: s.species,
    speciesId: s.speciesId,
    shape: s.shape,
    kg: s.kg,
    place: s.place,
    caughtAt: s.caughtAt,
    hoursAgo: Math.max(0, Math.round((now - s.caughtAt) / HOUR)),
  }
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

type Ctx = {
  catches: Catch[]
  addCatch: (c: NewCatch) => Promise<AddResult>
  addIce: (id: string, kg: number) => void
  setOutcome: (id: string, outcome: Outcome | null) => void
  resetDemo: () => void
}
const CatchesCtx = createContext<Ctx | null>(null)

// Catches live on the server now. userId and demo are still accepted so the screens that mount this keep working.
export function CatchesProvider({ children }: { children: ReactNode; userId: string; demo?: boolean }) {
  const [list, setList] = useState<Stored[]>([])
  const [now, setNow] = useState(() => Date.now())
  const codeToId = useRef<Map<string, string> | null>(null)

  const load = useCallback(async () => {
    try {
      const rows = await api.get<ApiCatch[]>('/catches')
      setList(rows.map(fromApi))
      setNow(Date.now())
    } catch {
      // keep what is on screen; a real 401 logs the person out through api.ts
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => {
      setNow(Date.now())
      load()
    }, 60_000)
    window.addEventListener('focus', load)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', load)
    }
  }, [load])

  const catches = useMemo(() => list.map((s) => derive(s, now)), [list, now])

  const replace = useCallback((row: ApiCatch) => {
    setList((prev) => prev.map((s) => (s.id === row.id ? fromApi(row) : s)))
  }, [])

  const speciesIdFor = useCallback(async (code: string) => {
    if (!codeToId.current) {
      const all = await api.get<ApiSpecies[]>('/species')
      codeToId.current = new Map(all.filter((s) => s.code).map((s) => [s.code as string, s.id]))
    }
    return codeToId.current.get(code)
  }, [])

  const addCatch = useCallback(
    async (c: NewCatch): Promise<AddResult> => {
      try {
        const sid = await speciesIdFor(c.speciesId ?? 'other')
        if (!sid) return { ok: false, message: 'Unknown species' }
        const row = await api.post<ApiCatch>('/catches', {
          speciesId: sid,
          kilos: c.kg,
          iceKg: c.model.events[0]?.iceKg ?? 0,
          place: c.place,
          caughtAt: new Date(c.caughtAt).toISOString(),
        })
        setList((prev) => [fromApi(row), ...prev])
        setNow(Date.now())
        return { ok: true, id: row.id }
      } catch (e) {
        return { ok: false, message: e instanceof ApiError ? e.message : 'Could not save the catch' }
      }
    },
    [speciesIdFor],
  )

  const addIce = useCallback(
    (id: string, kg: number) => {
      const at = Date.now()
      // show it at once, then take the server's version
      setList((prev) =>
        prev.map((s) => {
          if (s.id !== id || !s.model) return s
          const last = s.model.events[s.model.events.length - 1].iceKg
          return { ...s, model: { ...s.model, events: [...s.model.events, { at, iceKg: last + kg }] } }
        }),
      )
      setNow(at)
      api.post<ApiCatch>(`/catches/${id}/ice`, { kg }).then(replace).catch(() => load())
    },
    [replace, load],
  )

  const setOutcome = useCallback(
    (id: string, outcome: Outcome | null) => {
      const at = Date.now()
      setList((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s
          if (!outcome) return { ...s, outcome: undefined, closedRisk: undefined, closedAt: undefined }
          return { ...s, outcome, closedRisk: derive(s, at).risk, closedAt: at }
        }),
      )
      setNow(at)
      const req = outcome
        ? api.patch<ApiCatch>(`/catches/${id}/outcome`, { status: OUTCOME_TO_API[outcome] })
        : api.patch<ApiCatch>(`/catches/${id}/reopen`)
      req.then(replace).catch(() => load()) // a refused change snaps back to the server's version
    },
    [replace, load],
  )

  // the sample catches are gone; this just reloads from the server
  const resetDemo = useCallback(() => {
    load()
  }, [load])

  const value = useMemo(() => ({ catches, addCatch, addIce, setOutcome, resetDemo }), [catches, addCatch, addIce, setOutcome, resetDemo])
  return <CatchesCtx.Provider value={value}>{children}</CatchesCtx.Provider>
}

export function useCatches() {
  const v = useContext(CatchesCtx)
  if (!v) throw new Error('useCatches must be used inside <CatchesProvider>')
  return v
}