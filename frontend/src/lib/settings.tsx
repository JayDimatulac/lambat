import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'fil'
export type Theme = 'day' | 'night'
export type Connection = 'online' | 'weak' | 'offline'

type Settings = {
  lang: Lang | null // null until the person picks a language on first launch
  setLang: (l: Lang) => void
  simple: boolean
  setSimple: (v: boolean) => void
  theme: Theme
  setTheme: (t: Theme) => void
  connection: Connection // demo state until the backend and SMS exist
  setConnection: (c: Connection) => void
}

const Ctx = createContext<Settings | null>(null)

const read = (key: string) => {
  try { return localStorage.getItem(key) } catch { return null }
}
const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value) } catch { /* storage can be blocked */ }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(() => {
    const v = read('lambat.lang')
        return v === 'en' || v === 'fil' ? v : 'fil' // Filipino unless the person chooses otherwise
  })
  const [simple, setSimpleState] = useState(() => read('lambat.simple') === 'true')
  const [theme, setThemeState] = useState<Theme>(() => (read('lambat.theme') === 'night' ? 'night' : 'day'))
  const [connection, setConnection] = useState<Connection>('online')

  // Mirror the settings onto <html> so CSS can react to them
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang === 'fil' ? 'fil' : 'en'
    root.dataset.theme = theme
    root.dataset.simple = String(simple)
  }, [lang, theme, simple])

  const value = useMemo<Settings>(
    () => ({
      lang,
      setLang: (l) => { setLangState(l); write('lambat.lang', l) },
      simple,
      setSimple: (v) => { setSimpleState(v); write('lambat.simple', String(v)) },
      theme,
      setTheme: (t) => { setThemeState(t); write('lambat.theme', t) },
      connection,
      setConnection,
    }),
    [lang, simple, theme, connection],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings must be used inside <SettingsProvider>')
  return v
}