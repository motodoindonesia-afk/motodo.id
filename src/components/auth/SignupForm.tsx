import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, Mail } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import type { UserRole } from "../../types/auth"
import { Button } from "../ui/Button"
import { AuthGoogleButton } from "./AuthGoogleButton"
import { AuthInput, Field } from "./AuthField"
import { PasswordInput } from "./PasswordInput"
import { cn } from "../../lib/cn"
import { useLanguage } from "../../i18n"

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

export function SignupForm() {
  const { signup } = useAuth()
  const { t, tm } = useLanguage()
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

  const roles: { value: UserRole; title: string; description: string }[] = [
    {
      value: "buyer",
      title: t("auth.buyer"),
      description: t("auth.buyerDesc"),
    },
    {
      value: "seller",
      title: t("auth.seller"),
      description: t("auth.sellerDesc"),
    },
  ]

  function validate() {
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = t("auth.nameRequired")
    if (!email.trim()) next.email = t("auth.emailRequired")
    else if (!isValidEmail(email.trim())) next.email = t("auth.emailInvalid")
    if (!password) next.password = t("auth.passwordRequired")
    else if (password.length < 8) next.password = t("auth.passwordShort")
    if (!confirmPassword) next.confirmPassword = t("auth.confirmRequired")
    else if (confirmPassword !== password) next.confirmPassword = t("auth.passwordMismatch")
    if (!role) next.role = t("auth.selectAccountType")
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
      setFormError(error instanceof Error ? tm(error.message, "auth.unableCreate") : t("auth.unableCreate"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label={t("auth.fullName")} htmlFor="signup-name" error={errors.fullName}>
          <AuthInput
            id="signup-name"
            name="fullName"
            autoComplete="name"
            value={fullName}
            invalid={Boolean(errors.fullName)}
            placeholder={t("auth.namePlaceholder")}
            onChange={(event) => setFullName(event.target.value)}
          />
        </Field>
        <Field label={t("auth.email")} htmlFor="signup-email" error={errors.email}>
          <AuthInput
            id="signup-email"
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
        <Field label={t("auth.password")} htmlFor="signup-password" error={errors.password}>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            value={password}
            invalid={Boolean(errors.password)}
            placeholder={t("auth.newPasswordPlaceholder")}
            leading={<Lock className="size-4" />}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label={t("auth.confirmPassword")} htmlFor="signup-confirm" error={errors.confirmPassword}>
          <PasswordInput
            id="signup-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            placeholder={t("auth.confirmPlaceholder")}
            leading={<Lock className="size-4" />}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-navy">{t("auth.accountType")}</legend>
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
          {loading ? t("auth.creating") : t("auth.createAccount")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-navy-muted">
        <span className="h-px flex-1 bg-line" />
        <span>{t("auth.orContinueSignup")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <AuthGoogleButton
        label={t("auth.googleShort")}
        onClick={() => setGoogleNote(t("auth.comingSoonGoogle"))}
      />
      {googleNote ? (
        <p className="mt-3 text-center text-sm text-navy-muted" role="status">
          {googleNote}
        </p>
      ) : null}
    </>
  )
}
