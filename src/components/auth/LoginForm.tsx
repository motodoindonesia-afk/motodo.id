import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import { AuthInput, Field } from "./AuthField"
import { PasswordInput } from "./PasswordInput"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

type Errors = {
  email?: string
  password?: string
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [googleNote, setGoogleNote] = useState("")

  function validate() {
    const next: Errors = {}
    if (!email.trim()) next.email = "Email is required."
    else if (!isValidEmail(email.trim())) next.email = "Enter a valid email address."
    if (!password) next.password = "Password is required."
    else if (password.length < 8) next.password = "Password must be at least 8 characters."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError("")
    setGoogleNote("")
    if (!validate()) return

    setLoading(true)
    try {
      await login({ email, password })
      const next = searchParams.get("next")
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/"
      navigate(safeNext, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to log in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <AuthInput
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            placeholder="you@email.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            placeholder="Enter your password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm font-medium text-brand hover:text-brand-hover"
            onClick={() => setForgotOpen(true)}
          >
            Forgot password?
          </button>
        </div>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className="w-full py-3" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-navy-muted">
        <span className="h-px flex-1 bg-line" />
        OR
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full py-3"
        onClick={() => setGoogleNote("Google sign-in will be available soon.")}
      >
        Continue with Google
      </Button>
      {googleNote ? (
        <p className="mt-3 text-center text-sm text-navy-muted" role="status">
          {googleNote}
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-navy-muted">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-brand hover:text-brand-hover">
          Sign Up
        </Link>
      </p>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-navy/30"
            onClick={() => setForgotOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            className="relative z-10 mx-4 w-full max-w-md rounded-t-2xl bg-white px-6 py-6 sm:rounded-2xl"
          >
            <h2 id="forgot-title" className="text-lg font-bold text-navy">
              Forgot password
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted">
              Password recovery will be available once real authentication is connected.
            </p>
            <Button className="mt-6 w-full" onClick={() => setForgotOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
