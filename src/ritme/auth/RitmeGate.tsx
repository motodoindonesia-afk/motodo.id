import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../../context/AuthContext"
import { OPS } from "../../lib/opsPaths"
import { RitmeAccessDenied } from "../pages/RitmeAccessDenied"

export function RitmeGate({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
        <p className="text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to={OPS.login} replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return <RitmeAccessDenied />
  }

  return children
}
