import { Navigate } from "react-router-dom"
import { SignupForm } from "../components/auth/SignupForm"
import { AuthLayout } from "../components/auth/AuthLayout"
import { useAuth } from "../context/AuthContext"

export function SignupPage() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <AuthLayout
        title="Create your Motodo account"
        subtitle="Join Motodo to buy, save, and sell motorcycles."
      >
        <p className="text-sm text-navy-muted">Loading...</p>
      </AuthLayout>
    )
  }
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <AuthLayout
      title="Create your Motodo account"
      subtitle="Join Motodo to buy, save, and sell motorcycles."
    >
      <SignupForm />
    </AuthLayout>
  )
}
