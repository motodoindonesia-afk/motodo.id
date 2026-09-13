import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { UserAvatar } from "../components/profile/UserAvatar"
import { AuthInput } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { useLanguage } from "../i18n"

export function ProfileEditPage() {
  const { user, profile, updateProfile, loading } = useAuth()
  const { t, tm } = useLanguage()
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (loading || !user) {
    return <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
  }

  const displayName = profile?.fullName ?? user.fullName

  async function saveProfile() {
    if (!fullName.trim()) {
      setError(t("auth.nameRequired"))
      setSuccess("")
      return
    }
    setSaving(true)
    try {
      const next = await updateProfile({ fullName: fullName.trim() })
      if (!next) {
        setError(t("auth.unableUpdateProfile"))
        setSuccess("")
        return
      }
      setError("")
      setSuccess(t("profile.saved"))
    } catch (saveError) {
      setError(saveError instanceof Error ? tm(saveError.message, "auth.unableUpdateProfile") : t("auth.unableUpdateProfile"))
      setSuccess("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-card min-[769px]:p-5">
        <h1 className="text-heading font-semibold tracking-tight text-navy">{t("account.profileTitle")}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">{t("account.profileSubtitle")}</p>
        <div className="mt-4 border-t border-line" />

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void saveProfile()
          }}
        >
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
            <UserAvatar name={fullName.trim() || displayName} size="lg" />
            <p className="text-center text-meta text-navy-muted sm:text-left">{t("profile.avatarUnavailable")}</p>
          </div>

          <div>
            <label htmlFor="profile-name" className="mb-1 block text-ui font-medium text-navy">
              {t("profile.fullName")}
            </label>
            <AuthInput
              id="profile-name"
              className="h-10 text-ui"
              value={fullName}
              invalid={Boolean(error)}
              onChange={(event) => {
                setFullName(event.target.value)
                setSuccess("")
              }}
            />
            {error ? (
              <p className="mt-1 text-[11px] text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="profile-email" className="mb-1 block text-ui font-medium text-navy">
              {t("profile.email")}
            </label>
            <AuthInput id="profile-email" className="h-10 text-ui" value={user.email} readOnly aria-readonly="true" />
            <p className="mt-1 text-meta text-navy-muted">{t("profile.emailLocked")}</p>
          </div>

          <div>
            <p className="mb-1 text-ui font-medium text-navy">{t("profile.phone")}</p>
            <p className="text-[13px] text-navy">{user.phone?.trim() || t("account.phoneEmpty")}</p>
          </div>

          {success ? (
            <p className="text-[12px] text-success" role="status">
              {success}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" className="h-10 min-w-28 px-6 py-2 text-[13px]" disabled={saving}>
              {saving ? t("profile.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </section>
  )
}
