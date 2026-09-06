import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Lock, Mail } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { isSupabaseConfigured } from "../../lib/supabase"
import { supabaseSignInWithGoogle } from "../../lib/supabaseAuth"
import { Button } from "../ui/Button"
import { AuthGoogleButton } from "./AuthGoogleButton"
import { AuthInput, Field } from "./AuthField"
import { PasswordInput } from "./PasswordInput"
import { useLanguage } from "../../i18n"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

type Errors = {
  email?: string
  password?: string
}

export function LoginForm() {
  const { login } = useAuth()
  const { t, tm } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  useEffect(() => {
    const oauthError = searchParams.get("error_description") || searchParams.get("error")
    if (!oauthError) return
    setFormError(tm(oauthError.replace(/\+/g, " ")))
  }, [searchParams, tm])

  function validate() {
    const next: Errors = {}
    if (!email.trim()) next.email = t("auth.emailRequired")
    else if (!isValidEmail(email.trim())) next.email = t("auth.emailInvalid")
    if (!password) next.password = t("auth.passwordRequired")
    else if (password.length < 8) next.password = t("auth.passwordShort")
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError("")
    if (!validate()) return

    setLoading(true)
    try {
      await login({ email, password })
      const next = searchParams.get("next")
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/"
      navigate(safeNext, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? tm(error.message, "auth.unableLogin") : t("auth.unableLogin"))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setFormError("")
    if (!isSupabaseConfigured()) {
      setFormError(t("auth.envNotConfigured"))
      return
    }
    setGoogleLoading(true)
    try {
      await supabaseSignInWithGoogle()
    } catch (error) {
      setFormError(error instanceof Error ? tm(error.message, "auth.unableGoogle") : t("auth.unableGoogle"))
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label={t("auth.email")} htmlFor="login-email" error={errors.email}>
          <AuthInput
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            invalid={Boolean(errors.email)}
            placeholder={t("auth.emailPlaceholder")}
            leading={<Mail className="size-4" />}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label={t("auth.password")} htmlFor="login-password" error={errors.password}>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            invalid={Boolean(errors.password)}
            placeholder={t("auth.passwordPlaceholder")}
            leading={<Lock className="size-4" />}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => setForgotOpen(true)}
          >
            {t("auth.forgot")}
          </button>
        </div>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className="w-full py-3" disabled={loading}>
          {loading ? t("auth.loggingIn") : t("auth.signInCta")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-navy-muted">
        <span className="h-px flex-1 bg-line" />
        <span>{t("auth.orContinue")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthGoogleButton
        label={t("auth.googleShort")}
        disabled={googleLoading}
        onClick={() => void handleGoogle()}
      />

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label={t("common.close")}
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
              {t("auth.forgotTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted">
              {t("auth.forgotBody")}
            </p>
            <Button className="mt-6 w-full" onClick={() => setForgotOpen(false)}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
