import { Navigate, useSearchParams } from "react-router-dom"
import { LoginForm } from "../components/auth/LoginForm"
import { AuthLayout } from "../components/auth/AuthLayout"
import { useAuth } from "../context/AuthContext"
import { useT } from "../i18n"

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth()
  const t = useT()
  const [searchParams] = useSearchParams()
  const next = searchParams.get("next")
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/"
  if (loading) {
    return (
      <AuthLayout variant="login">
        <p className="text-sm text-navy-muted">{t("common.loading")}</p>
      </AuthLayout>
    )
  }
  if (isAuthenticated) return <Navigate to={safeNext} replace />

  return (
    <AuthLayout variant="login">
      <LoginForm />
    </AuthLayout>
  )
}
