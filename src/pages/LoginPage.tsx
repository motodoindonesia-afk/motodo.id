import { Navigate } from "react-router-dom"
import { LoginForm } from "../components/auth/LoginForm"
import { AuthLayout } from "../components/auth/AuthLayout"
import { useAuth } from "../context/AuthContext"

export function LoginPage() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your Motodo account.">
      <LoginForm />
    </AuthLayout>
  )
}
