import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import type { ReactNode } from "react"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return children
}
