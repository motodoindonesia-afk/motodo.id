import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import type { ReactNode } from "react"

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/profile" replace />
  }

  return children
}
