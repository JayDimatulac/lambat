import { Navigate } from 'react-router-dom'

/* Alerts live in the bell dropdown now, not on a page. */
export default function BuyerAlerts() {
  return <Navigate to="/buyer" replace />
}