import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import type { UserRole } from "../../types/auth"
import { Button } from "../ui/Button"
import { AuthInput, Field } from "./AuthField"
import { PasswordInput } from "./PasswordInput"
import { cn } from "../../lib/cn"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

type Errors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
}

const roles: { value: UserRole; title: string; description: string }[] = [
  {
    value: "buyer",
    title: "Buyer",
    description: "Browse motorcycles, save favorites, and contact sellers.",
  },
  {
    value: "seller",
    title: "Seller",
    description: "List motorcycles and connect with buyers.",
  },
]

export function SignupForm() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("buyer")
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleNote, setGoogleNote] = useState("")

  function validate() {
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = "Full name is required."
    if (!email.trim()) next.email = "Email is required."
    else if (!isValidEmail(email.trim())) next.email = "Enter a valid email address."
    if (!password) next.password = "Password is required."
    else if (password.length < 8) next.password = "Password must be at least 8 characters."
    if (!confirmPassword) next.confirmPassword = "Confirm your password."
    else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match."
    if (!role) next.role = "Select an account type."
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
      await signup({ fullName, email, password, confirmPassword, role })
      navigate("/", { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Full Name" htmlFor="signup-name" error={errors.fullName}>
          <AuthInput
            id="signup-name"
            name="fullName"
            autoComplete="name"
            value={fullName}
            invalid={Boolean(errors.fullName)}
            placeholder="Your name"
            onChange={(event) => setFullName(event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="signup-email" error={errors.email}>
          <AuthInput
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            placeholder="you@email.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="signup-password" error={errors.password}>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            value={password}
            invalid={Boolean(errors.password)}
            placeholder="At least 8 characters"
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm Password" htmlFor="signup-confirm" error={errors.confirmPassword}>
          <PasswordInput
            id="signup-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            placeholder="Re-enter your password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-navy">Account type</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((option) => {
              const selected = role === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-xl border px-4 py-3",
                    selected ? "border-brand bg-surface" : "border-line bg-white hover:border-navy/20",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-navy">{option.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-navy-muted">
                    {option.description}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.role ? (
            <p className="mt-1.5 text-sm text-red-700" role="alert">
              {errors.role}
            </p>
          ) : null}
        </fieldset>

        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full py-3" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
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
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand hover:text-brand-hover">
          Log In
        </Link>
      </p>
    </>
  )
}
