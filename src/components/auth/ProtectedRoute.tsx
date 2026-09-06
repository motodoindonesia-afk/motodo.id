import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import type { ReactNode } from "react"
import { EmptyState } from "../ui/EmptyState"
import { useT } from "../../i18n"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const t = useT()

  if (loading) {
    return (
      <main className="bg-white py-16">
        <div className="mx-auto max-w-md px-5">
          <EmptyState title={t("common.loading")} />
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return children
}
