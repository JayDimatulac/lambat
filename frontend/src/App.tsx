import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyCatches from './pages/MyCatches'
import Placeholder from './pages/Placeholder'
import { useT, type Key } from './lib/i18n'
import { useSettings } from './lib/settings'

// Placeholder screens get their title from the dictionary so the language toggle works on them too
function Ph({ k }: { k: Key }) {
  const t = useT()
  return <Placeholder title={t(k)} />
}

// First launch: pick a language before anything else
function LanguageGate() {
  const { setLang } = useSettings()
  const btn = 'min-h-16 w-full rounded-md bg-card px-6 font-display text-xl font-semibold text-navy shadow-raised transition active:scale-[0.98]'
  return (
    <div className="bg-dawn grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center text-white">
        <p className="font-display text-3xl font-bold tracking-wider">LAMBAT</p>
        <p className="pb-4 text-lg font-semibold">Choose your language · Piliin ang wika</p>
        <button type="button" className={btn} onClick={() => setLang('en')}>English</button>
        <button type="button" className={btn} onClick={() => setLang('fil')}>Filipino</button>
      </div>
    </div>
  )
}

export default function App() {
  const { lang } = useSettings()
  if (lang === null) return <LanguageGate />
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/catches" element={<MyCatches />} />
        <Route path="/catches/new" element={<Ph k="page.log" />} />
        <Route path="/catches/:id" element={<Ph k="page.detail" />} />
        <Route path="/weather" element={<Ph k="nav.weather" />} />
        <Route path="/buyers" element={<Ph k="nav.buyers" />} />
        <Route path="/value-added" element={<Ph k="nav.value" />} />
        <Route path="/notifications" element={<Ph k="nav.alerts" />} />
        <Route path="/profile" element={<Ph k="nav.profile" />} />
        <Route path="/settings" element={<Ph k="nav.settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}