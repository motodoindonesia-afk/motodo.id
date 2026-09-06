import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { isAdmin } from "../../lib/admin"
import { OPS } from "../../lib/opsPaths"
import { userFacingMessage } from "../../lib/userFacingError"
import { Button } from "../../components/ui/Button"
import { AuthInput, Field } from "../../components/auth/AuthField"
import { PasswordInput } from "../../components/auth/PasswordInput"
import { RitmeAccessDenied } from "./RitmeAccessDenied"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function RitmeLoginPage() {
  const { login, user, loading, isAdmin: sessionIsAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [denied, setDenied] = useState(false)

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
        <p className="text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }

  if (user && sessionIsAdmin) {
    const from = (location.state as { from?: string } | null)?.from
    const next = from && from.startsWith("/") && !from.startsWith("//") && from !== OPS.login ? from : OPS.dashboard
    return <Navigate to={next} replace />
  }

  if ((user && !sessionIsAdmin) || denied) {
    return <RitmeAccessDenied />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError("")
    setDenied(false)
    const nextEmailError = !email.trim() ? "Email is required." : isValidEmail(email.trim()) ? "" : "Enter a valid email address."
    const nextPasswordError = !password ? "Password is required." : password.length < 8 ? "Password must be at least 8 characters." : ""
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return

    setSubmitting(true)
    try {
      const next = await login({ email, password })
      if (!isAdmin(next)) {
        setDenied(true)
        return
      }
      navigate(OPS.dashboard, { replace: true })
    } catch (error) {
      setFormError(userFacingMessage(error, "Unable to log in. Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white px-6 py-8 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-muted">RITME</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy">Motodo Operations</h1>
        <p className="mt-2 text-sm text-navy-muted">Sign in with an admin account.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Email" htmlFor="ritme-email" error={emailError}>
            <AuthInput
              id="ritme-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              invalid={Boolean(emailError)}
              placeholder="admin@email.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="ritme-password" error={passwordError}>
            <PasswordInput
              id="ritme-password"
              name="password"
              autoComplete="current-password"
              value={password}
              invalid={Boolean(passwordError)}
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {formError ? (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="w-full py-3" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  )
}
