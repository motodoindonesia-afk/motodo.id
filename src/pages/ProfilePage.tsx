import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { formatMemberSince } from "../lib/profile"
import { useLanguage } from "../i18n"
import { deleteListing, getListingsBySeller } from "../lib/listings"
import { getSellerProfile, isSellerProfilesReady } from "../lib/seller"
import { useSellerLive } from "../lib/useSellerLive"
import { useListingsLive } from "../lib/useListingsLive"
import { SellerStatusBadge } from "../components/seller/SellerStatusBadge"
import { SellerListingCard } from "../components/seller/SellerListingCard"
import { DeleteListingModal } from "../components/seller/DeleteListingModal"
import { AuthInput, Field } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { ViewAllLink } from "../components/ui/ViewAllLink"
import { Container } from "../components/layout/Container"
import type { MotorcycleListing } from "../types/sellerListing"

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value}</dd>
    </div>
  )
}

function SellerCenter({ userId, isSellerRole }: { userId: string; isSellerRole: boolean }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  useSellerLive()
  const profile = getSellerProfile(userId)

  if (!profile && !isSellerRole) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-navy">{t("profile.wantSell")}</h2>
        <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
          <p className="text-sm leading-relaxed text-navy-muted">
            {t("profile.registerSeller")}
          </p>
          <Button className="mt-4" onClick={() => navigate("/seller/register")}>
            {t("nav.becomeSeller")}
          </Button>
        </div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-navy">{t("profile.sellerCenter")}</h2>
        <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
          <p className="text-sm font-medium text-navy">{t("profile.completeReg")}</p>
          <p className="mt-2 text-sm leading-relaxed text-navy-muted">
            {t("profile.completeRegBody")}
          </p>
          <Button className="mt-4" onClick={() => navigate("/seller/register")}>
            {t("nav.becomeSeller")}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-navy">{t("profile.sellerCenter")}</h2>
      <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-navy">
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
        <p className="mt-2 text-sm text-navy-muted">{profile.businessName}</p>
        {profile.status === "rejected" && profile.rejectionReason ? (
          <p className="mt-2 text-sm text-red-700">{profile.rejectionReason}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/seller/dashboard")}>{t("nav.sellerDashboard")}</Button>
          {profile.status === "rejected" ? (
            <Button variant="secondary" onClick={() => navigate("/seller/register")}>
              {t("profile.editRegistration")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function ProfilePage() {
  const { user, profile, logout, updateProfile, loading } = useAuth()
  const { t, tm } = useLanguage()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<MotorcycleListing | null>(null)
  useListingsLive()
  useSellerLive()

  if (loading || !isSellerProfilesReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  if (!user) return null
  const displayName = profile?.fullName ?? user.fullName
  const accountType = profile?.accountType ?? user.role
  const privilegeLabel = profile?.role === "admin" ? t("auth.admin") : t("auth.user")
  const accountTypeLabel = accountType === "seller" ? t("auth.seller") : t("auth.buyer")
  const accountTypeDesc = accountType === "seller" ? t("auth.sellerDesc") : t("auth.buyerDesc")
  const sellerListings = getListingsBySeller(user.id)
  const sellerProfile = getSellerProfile(user.id)

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
    try {
      const next = await updateProfile({ fullName: fullName.trim() })
      if (!next) {
        setError(t("auth.unableUpdateProfile"))
        setSuccess("")
        return
      }
      setEditing(false)
      setError("")
      setSuccess(t("profile.saved"))
    } catch (saveError) {
      setError(saveError instanceof Error ? tm(saveError.message, "auth.unableUpdateProfile") : t("auth.unableUpdateProfile"))
      setSuccess("")
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("nav.myProfile")}</h1>
          <p className="mt-2 text-navy-muted">{t("profile.subtitle")}</p>

          <section className="mt-8 rounded-2xl border border-line bg-white px-5 py-6 sm:px-6">
            <dl className="space-y-4">
              <InfoRow label={t("profile.fullName")} value={displayName} />
              <InfoRow label={t("profile.email")} value={user.email} />
              <InfoRow label={t("profile.accountType")} value={accountTypeLabel} />
              <InfoRow label={t("profile.role")} value={privilegeLabel} />
              <InfoRow label={t("profile.memberSince")} value={formatMemberSince(profile?.createdAt ?? user.createdAt)} />
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">{t("profile.personal")}</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              {editing ? (
                <div className="space-y-4">
                  <Field label={t("profile.fullName")} htmlFor="profile-name" error={error}>
                    <AuthInput
                      id="profile-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      invalid={Boolean(error)}
                    />
                  </Field>
                  <div>
                    <p className="text-sm font-medium text-navy">{t("profile.email")}</p>
                    <p className="mt-1 text-sm text-navy-muted">{user.email}</p>
                    <p className="mt-1 text-xs text-navy-muted">{t("profile.emailLocked")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">{t("profile.accountType")}</p>
                    <p className="mt-1 text-sm text-navy-muted">{accountTypeLabel}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={saveProfile}>{t("common.save")}</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                    setFullName(displayName)
                        setEditing(false)
                        setError("")
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="space-y-4">
                    <InfoRow label={t("profile.fullName")} value={displayName} />
                    <InfoRow label={t("profile.email")} value={user.email} />
                    <InfoRow label={t("profile.accountType")} value={accountTypeLabel} />
                    <InfoRow label={t("profile.role")} value={privilegeLabel} />
                  </dl>
                  {success ? (
                    <p className="mt-4 text-sm text-brand" role="status">
                      {success}
                    </p>
                  ) : null}
                  <Button
                    className="mt-6"
                    onClick={() => {
                      setFullName(displayName)
                      setEditing(true)
                      setSuccess("")
                    }}
                  >
                    {t("profile.editProfile")}
                  </Button>
                </>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">{t("profile.accountType")}</h2>
            <div className="mt-4 rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
              <p className="text-sm font-semibold text-navy">{accountTypeLabel}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-muted">{accountTypeDesc}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">{t("common.orders")}</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">{t("profile.viewOrders")}</p>
              <p className="mt-2 text-sm text-navy-muted">{t("orders.reviewHint")}</p>
              <Button className="mt-4" onClick={() => navigate("/orders")}>
                {t("nav.myOrders")}
              </Button>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">{t("common.messages")}</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">{t("profile.messagesBody")}</p>
              <Button className="mt-4" onClick={() => navigate("/messages")}>
                {t("common.messages")}
              </Button>
            </div>
          </section>

          <SellerCenter userId={user.id} isSellerRole={accountType === "seller"} />

          {sellerProfile ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-navy">{t("profile.myListings")}</h2>
              {sellerListings.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-line px-5 py-8 text-center sm:px-6">
                  <p className="text-sm text-navy-muted">{t("profile.noListings")}</p>
                  {sellerProfile.status === "approved" ? (
                    <Button className="mt-4" onClick={() => navigate("/seller/listings/new")}>
                      {t("profile.addMotorcycle")}
                    </Button>
                  ) : (
                    <p className="mt-2 text-sm text-navy-muted">
                      {t("profile.listingAfterApproval")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {sellerListings.map((listing) => (
                    <SellerListingCard key={listing.id} listing={listing} onDelete={setDeleteTarget} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-bold text-navy">{t("profile.savedTitle")}</h2>
              <ViewAllLink href="/favorites">{t("profile.viewAllSaved")}</ViewAllLink>
            </div>
            <div className="mt-4 rounded-2xl border border-line px-5 py-8 sm:px-6">
              <p className="text-sm text-navy-muted">
                {t("profile.savedBody")}
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-navy">{t("profile.account")}</h2>
            <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <p className="text-sm text-navy-muted">{t("profile.signOutBody")}</p>
              <Button variant="secondary" className="mt-4" onClick={handleLogout}>
                {t("common.logout")}
              </Button>
            </div>
          </section>
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
