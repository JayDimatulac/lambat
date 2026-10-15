import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyCatches from './pages/MyCatches'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/catches" element={<MyCatches />} />
        <Route path="/catches/new" element={<Placeholder title="Itala ang Huli" />} />
        <Route path="/catches/:id" element={<Placeholder title="Detalye ng Huli" />} />
        <Route path="/weather" element={<Placeholder title="Panahon" />} />
        <Route path="/buyers" element={<Placeholder title="Mamimili" />} />
        <Route path="/value-added" element={<Placeholder title="Pagpapalaki ng Halaga" />} />
        <Route path="/notifications" element={<Placeholder title="Mga Abiso" />} />
        <Route path="/profile" element={<Placeholder title="Aking Profile" />} />
        <Route path="/settings" element={<Placeholder title="Mga Setting" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}