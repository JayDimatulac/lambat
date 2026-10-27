import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Admin from './pages/Admin'
import BuyerHome from './pages/BuyerHome'
import Buyers from './pages/Buyers'
import CatchDetail from './pages/CatchDetail'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import LogCatch from './pages/LogCatch'
import MyCatches from './pages/MyCatches'
import Placeholder from './pages/Placeholder'
import Register from './pages/Register'
import Soon from './pages/Soon'
import ValueAdded from './pages/ValueAdded'
import Weather from './pages/Weather'
import { CatchesProvider } from './data/store'
import { useAuth } from './lib/auth'
import { ROLE_HOME, type Role } from './lib/accounts'
import { useT, type Key } from './lib/i18n'

// Placeholder screens get their title from the dictionary so the language toggle works on them too
function Ph({ k }: { k: Key }) {
  const t = useT()
  return <Placeholder title={t(k)} />
}

// Only the right role gets in. Anyone else is sent to the login or to their own home.
// This is for the screen only. The real rule is enforced by the server.
function Guard({ role, children }: { role: Role; children?: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />
  return <>{children ?? <Outlet />}</>
}

// Everything the fisherfolk see. Each fisherfolk account keeps its own catches.
function FisherApp() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <CatchesProvider key={user.id} userId={user.id} demo={!!user.demo}>
      <Outlet />
    </CatchesProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Register />} />

      <Route path="/buyer" element={<Guard role="buyer"><BuyerHome /></Guard>} />
      <Route path="/org" element={<Guard role="organization"><Soon /></Guard>} />
      <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />

      <Route element={<Guard role="fisherfolk" />}>
        <Route element={<FisherApp />}>
          <Route path="/catches/new" element={<LogCatch />} />
          <Route element={<AppShell />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/catches" element={<MyCatches />} />
            <Route path="/catches/:id" element={<CatchDetail />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/buyers" element={<Buyers />} />
            <Route path="/value-added" element={<ValueAdded />} />
            <Route path="/notifications" element={<Ph k="nav.alerts" />} />
            <Route path="/profile" element={<Ph k="nav.profile" />} />
            <Route path="/settings" element={<Ph k="nav.settings" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}