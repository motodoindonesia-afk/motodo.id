import { Navigate } from "react-router-dom"
import { SignupForm } from "../components/auth/SignupForm"
import { AuthLayout } from "../components/auth/AuthLayout"
import { useAuth } from "../context/AuthContext"
import { useT } from "../i18n"

export function SignupPage() {
  const { isAuthenticated, loading } = useAuth()
  const t = useT()
  if (loading) {
    return (
      <AuthLayout variant="signup">
        <p className="text-sm text-navy-muted">{t("common.loading")}</p>
      </AuthLayout>
    )
  }
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <AuthLayout variant="signup">
      <SignupForm />
    </AuthLayout>
  )
}
