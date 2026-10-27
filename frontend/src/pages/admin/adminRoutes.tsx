import type { RouteObject } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Dashboard from './Dashboard'
import Verifications from './Verifications'
import Listings from './Listings'
import Advisories from './Advisories'
import Reference from './Reference'

export const adminRoutes: RouteObject = {
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'verifications', element: <Verifications /> },
    { path: 'listings', element: <Listings /> },
    { path: 'advisories', element: <Advisories /> },
    { path: 'reference', element: <Reference /> },
  ],
}