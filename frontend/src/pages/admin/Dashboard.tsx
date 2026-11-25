import { useUser } from '../../lib/auth'
import AdminHome from './AdminHome'
import SuperOverview from './SuperOverview'

// Admin: the application review workspace. Super Admin: the platform overview.
export default function Dashboard() {
  const user = useUser()
  return user.role === 'super_admin' ? <SuperOverview /> : <AdminHome />
}