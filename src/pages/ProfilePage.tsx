import { useState, type ReactNode } from "react"
import { Camera } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { accountUsername, maskEmail, maskPhone } from "../lib/profile"
import { useLanguage } from "../i18n"
import { deleteListing, getListingsBySeller } from "../lib/listings"
import { getSellerProfile, isSellerProfilesReady } from "../lib/seller"
import { useSellerLive } from "../lib/useSellerLive"
import { useListingsLive } from "../lib/useListingsLive"
import { SellerStatusBadge } from "../components/seller/SellerStatusBadge"
import { SellerListingCard } from "../components/seller/SellerListingCard"
import { DeleteListingModal } from "../components/seller/DeleteListingModal"
import { AuthInput } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { AccountMobileNav, AccountSidebar } from "../components/profile/AccountSidebar"
import { UserAvatar } from "../components/profile/UserAvatar"
import { cn } from "../lib/cn"
import type { MotorcycleListing } from "../types/sellerListing"

const inputClass = "h-10 text-[14px]"

function SellerCenter({ userId, isSellerRole }: { userId: string; isSellerRole: boolean }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  useSellerLive()
  const profile = getSellerProfile(userId)

  if (!profile && !isSellerRole) {
    return (
      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
        <h2 className="text-[15px] font-semibold text-navy">{t("profile.wantSell")}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-navy-muted">{t("profile.registerSeller")}</p>
        <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
          {t("nav.becomeSeller")}
        </Button>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
        <h2 className="text-[15px] font-semibold text-navy">{t("profile.sellerCenter")}</h2>
        <p className="mt-1 text-[13px] font-medium text-navy">{t("profile.completeReg")}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">{t("profile.completeRegBody")}</p>
        <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
          {t("nav.becomeSeller")}
        </Button>
      </section>
    )
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="text-[15px] font-semibold text-navy">{t("profile.sellerCenter")}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-medium text-navy">
          {profile.status === "approved"
            ? t("listing.verifiedSeller")
            : profile.status === "rejected"
              ? t("seller.rejectedReg")
              : t("seller.verifyPending")}
        </p>
        <SellerStatusBadge
          status={profile.status}
          label={profile.status === "approved" ? t("listing.verifiedSeller") : undefined}
        />
      </div>
      <p className="mt-1 text-[13px] text-navy-muted">{profile.businessName}</p>
      {profile.status === "rejected" && profile.rejectionReason ? (
        <p className="mt-2 text-[13px] text-red-700">{profile.rejectionReason}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button className="h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/dashboard")}>
          {t("nav.sellerDashboard")}
        </Button>
        {profile.status === "rejected" ? (
          <Button variant="secondary" className="h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
            {t("profile.editRegistration")}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { user, profile, logout, updateProfile, loading } = useAuth()
  const { t, tm } = useLanguage()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<MotorcycleListing | null>(null)
  useListingsLive()
  useSellerLive()

  if (loading || !isSellerProfilesReady()) {
    return (
      <main className="bg-surface py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  if (!user) return null

  const displayName = profile?.fullName ?? user.fullName
  const accountType = profile?.accountType ?? user.role
  const sellerListings = getListingsBySeller(user.id)
  const sellerProfile = getSellerProfile(user.id)
  const username = accountUsername(user.email)
  const shopName = sellerProfile?.businessName ?? ""

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

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
    <main className="bg-surface py-4 min-[769px]:py-6">
      <Container>
        <div className="flex flex-col gap-4 min-[769px]:flex-row min-[769px]:items-start min-[769px]:gap-6">
          <AccountSidebar name={displayName} username={username} onLogout={handleLogout} />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-3 min-[769px]:hidden">
              <UserAvatar name={displayName} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{displayName}</p>
                <p className="truncate text-xs text-navy-muted">{username}</p>
              </div>
            </div>
            <AccountMobileNav onLogout={handleLogout} />

            <section className="rounded-2xl border border-line bg-white p-4 shadow-card min-[769px]:p-6">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">{t("nav.myProfile")}</h1>
              <p className="mt-1 text-[14px] leading-relaxed text-navy-muted">{t("profile.subtitleManage")}</p>
              <div className="mt-4 border-t border-line" />

              <div className="mt-5 flex flex-col gap-6 min-[769px]:flex-row">
                <form
                  className="min-w-0 flex-1 space-y-3.5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveProfile()
                  }}
                >
                  <FieldRow label={t("profile.username")} htmlFor="profile-username">
                    <AuthInput
                      id="profile-username"
                      className={inputClass}
                      value={username.replace(/^@/, "")}
                      readOnly
                      aria-readonly="true"
                    />
                  </FieldRow>

                  <FieldRow label={t("profile.name")} htmlFor="profile-name" error={error}>
                    <AuthInput
                      id="profile-name"
                      className={inputClass}
                      value={fullName}
                      invalid={Boolean(error)}
                      onChange={(event) => {
                        setFullName(event.target.value)
                        setSuccess("")
                      }}
                    />
                  </FieldRow>

                  <MaskedRow
                    label={t("profile.email")}
                    value={maskEmail(user.email)}
                    actionLabel={t("profile.change")}
                    actionHint={t("profile.changeNotReady")}
                  />

                  <MaskedRow
                    label={t("profile.phone")}
                    value={user.phone ? maskPhone(user.phone) : t("profile.fieldUnavailable")}
                    actionLabel={t("profile.change")}
                    actionHint={t("profile.changeNotReady")}
                  />

                  <FieldRow label={t("profile.shopName")} htmlFor="profile-shop">
                    <AuthInput
                      id="profile-shop"
                      className={inputClass}
                      value={shopName || "—"}
                      readOnly
                      aria-readonly="true"
                    />
                    {sellerProfile ? (
                      <p className="mt-1 text-[12px] text-navy-muted">
                        {t("profile.shopEditHint")}{" "}
                        <Link to="/seller/profile" className="font-medium text-brand hover:text-brand-hover">
                          {t("nav.sellerProfile")}
                        </Link>
                      </p>
                    ) : (
                      <p className="mt-1 text-[12px] text-navy-muted">{t("profile.fieldUnavailable")}</p>
                    )}
                  </FieldRow>

                  <fieldset disabled className="space-y-2">
                    <legend className="text-[13px] font-medium text-navy">{t("profile.gender")}</legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-navy-muted">
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name="gender" disabled className="accent-brand" />
                        {t("profile.genderMale")}
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name="gender" disabled className="accent-brand" />
                        {t("profile.genderFemale")}
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name="gender" disabled className="accent-brand" />
                        {t("profile.genderOther")}
                      </label>
                    </div>
                    <p className="text-[12px] text-navy-muted">{t("profile.fieldUnavailable")}</p>
                  </fieldset>

                  <FieldRow label={t("profile.birthDate")} htmlFor="profile-birth">
                    <AuthInput id="profile-birth" type="date" className={inputClass} disabled aria-disabled="true" />
                    <p className="mt-1 text-[12px] text-navy-muted">{t("profile.fieldUnavailable")}</p>
                  </FieldRow>

                  {success ? (
                    <p className="text-[13px] text-success" role="status">
                      {success}
                    </p>
                  ) : null}

                  <Button type="submit" className="h-10 min-w-28 px-6 py-2 text-[14px]" disabled={saving}>
                    {saving ? t("profile.saving") : t("common.save")}
                  </Button>
                </form>

                <div className="flex flex-col items-center gap-3 min-[769px]:w-[200px] min-[769px]:shrink-0">
                  <UserAvatar name={displayName} size="lg" />
                  <button
                    type="button"
                    disabled
                    title={t("profile.avatarUnavailable")}
                    aria-label={t("profile.chooseImage")}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[14px] font-medium text-navy opacity-60"
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    {t("profile.chooseImage")}
                  </button>
                  <p className="text-center text-[12px] leading-relaxed text-navy-muted">
                    {t("profile.imageSize")}
                    <br />
                    {t("profile.imageFormat")}
                  </p>
                </div>
              </div>
            </section>

            <SellerCenter userId={user.id} isSellerRole={accountType === "seller"} />

            {sellerProfile ? (
              <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
                <h2 className="text-[15px] font-semibold text-navy">{t("profile.myListings")}</h2>
                {sellerListings.length === 0 ? (
                  <div className="mt-3 text-center">
                    <p className="text-[13px] text-navy-muted">{t("profile.noListings")}</p>
                    {sellerProfile.status === "approved" ? (
                      <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/listings/new")}>
                        {t("profile.addMotorcycle")}
                      </Button>
                    ) : (
                      <p className="mt-2 text-[13px] text-navy-muted">{t("profile.listingAfterApproval")}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {sellerListings.map((listing) => (
                      <SellerListingCard key={listing.id} listing={listing} onDelete={setDeleteTarget} />
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </div>
      </Container>
      {deleteTarget ? (
        <DeleteListingModal
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteListing(deleteTarget.id, user.id)
            setDeleteTarget(null)
          }}
        />
      ) : null}
    </main>
  )
}

function FieldRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-medium text-navy">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function MaskedRow({
  label,
  value,
  actionLabel,
  actionHint,
}: {
  label: string
  value: string
  actionLabel: string
  actionHint: string
}) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-medium text-navy">{label}</p>
      <div className="flex min-w-0 items-center gap-3">
        <p className="min-w-0 truncate text-[14px] text-navy">{value}</p>
        <button
          type="button"
          disabled
          title={actionHint}
          className={cn("shrink-0 text-[13px] font-medium text-brand/50")}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
