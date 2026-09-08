import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { AuthInput, AuthTextarea, Field } from "../../components/auth/AuthField"
import { UserAvatar } from "../../components/profile/UserAvatar"
import { SellerCenterLayout } from "../../components/seller/SellerCenterLayout"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { useAuth } from "../../context/AuthContext"
import { businessTypeLabel, useLanguage } from "../../i18n"
import { getSellerListingCounts } from "../../lib/listings"
import { getSellerProfile, updateSellerProfile } from "../../lib/seller"
import { isValidIndonesianPhone } from "../../lib/sellerForm"
import { publicSellerPath } from "../../lib/sellers"
import { useListingsLive } from "../../lib/useListingsLive"
import { useSellerLive } from "../../lib/useSellerLive"

export function SellerProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useListingsLive()
  const { locale, t, tm } = useLanguage()
  const profile = user ? getSellerProfile(user.id) : null

  const [businessName, setBusinessName] = useState(profile?.businessName ?? "")
  const [description, setDescription] = useState(profile?.description ?? "")
  const [city, setCity] = useState(profile?.city ?? "")
  const [showroomAddress, setShowroomAddress] = useState(profile?.showroomAddress ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!user) return null
  if (!profile) return <Navigate to="/profile" replace />

  const approved = profile.status === "approved"
  const listingCounts = getSellerListingCounts(user.id)
  const currentUser = user

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setSaved(false)
    if (!businessName.trim()) {
      setError(t("seller.businessNameRequired"))
      return
    }
    if (!description.trim()) {
      setError(t("seller.descRequired"))
      return
    }
    if (!city.trim()) {
      setError(t("checkout.cityRequired"))
      return
    }
    if (!showroomAddress.trim()) {
      setError(t("form.showroomRequired"))
      return
    }
    if (!phone.trim() || !isValidIndonesianPhone(phone)) {
      setError(t("seller.phoneInvalid"))
      return
    }

    setLoading(true)
    try {
      const next = await updateSellerProfile(currentUser.id, {
        businessName: businessName.trim(),
        description: description.trim(),
        city: city.trim(),
        showroomAddress: showroomAddress.trim(),
        phone: phone.trim(),
      })
      if (!next) throw new Error("Unable to update seller profile.")
      setBusinessName(next.businessName)
      setDescription(next.description)
      setCity(next.city)
      setShowroomAddress(next.showroomAddress)
      setPhone(next.phone)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? tm(err.message, "seller.unableUpdateProfile") : t("seller.unableUpdateProfile"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SellerCenterLayout>
      <div className="space-y-3">
        {profile.status !== "approved" ? (
          <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
            {profile.status === "pending" ? (
              <>
                <p className="text-[14px] font-semibold text-navy">{t("seller.pendingReview")}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-navy-muted">{t("seller.pendingCannot")}</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-navy">{t("seller.rejectedTitle")}</p>
                {profile.rejectionReason ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-navy">{profile.rejectionReason}</p>
                ) : null}
                <Button className="mt-3 h-10 px-4 py-2 text-[14px]" onClick={() => navigate("/seller/register")}>
                  {t("profile.editRegistration")}
                </Button>
              </>
            )}
          </section>
        ) : null}

        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-navy">{t("seller.storeProfileTitle")}</h1>
          <p className="mt-1 text-[14px] leading-relaxed text-navy-muted">{t("seller.storeProfileSubtitle")}</p>
        </div>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-start gap-3">
            <UserAvatar name={profile.businessName} size="md" className="size-12 rounded-lg text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[16px] font-semibold text-navy">{profile.businessName}</h2>
                <SellerStatusBadge
                  status={profile.status}
                  label={approved ? t("listing.verifiedSeller") : undefined}
                />
              </div>
              {profile.city ? <p className="mt-0.5 truncate text-[13px] text-navy-muted">{profile.city}</p> : null}
              <p className="mt-1 text-[13px] text-navy-muted">{t("seller.listingCount", { count: listingCounts.total })}</p>
            </div>
          </div>
          <div className="mt-3">
            {approved ? (
              <Link
                to={publicSellerPath(user.id)}
                className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[14px] font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("seller.visitStore")}
              </Link>
            ) : (
              <p className="text-[12px] text-navy-muted">{t("seller.storeNotPublic")}</p>
            )}
          </div>
        </section>

        <form className="rounded-2xl border border-line bg-white p-4 shadow-card" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <h2 className="text-[16px] font-semibold text-navy">{t("seller.storeInfo")}</h2>
          <div className="mt-3 space-y-3">
            <Field label={t("seller.shopName")} htmlFor="store-name">
              <AuthInput
                id="store-name"
                className="h-10 text-[14px]"
                value={businessName}
                autoComplete="organization"
                onChange={(event) => {
                  setSaved(false)
                  setBusinessName(event.target.value)
                }}
              />
            </Field>
            <Field label={t("seller.businessDesc")} htmlFor="store-description">
              <AuthTextarea
                id="store-description"
                className="min-h-24 text-[14px]"
                value={description}
                onChange={(event) => {
                  setSaved(false)
                  setDescription(event.target.value)
                }}
              />
            </Field>
            <Field label={t("orders.city")} htmlFor="store-city">
              <AuthInput
                id="store-city"
                className="h-10 text-[14px]"
                value={city}
                autoComplete="address-level2"
                onChange={(event) => {
                  setSaved(false)
                  setCity(event.target.value)
                }}
              />
            </Field>
            <Field label={t("seller.showroomAddress")} htmlFor="store-address">
              <AuthInput
                id="store-address"
                className="h-10 text-[14px]"
                value={showroomAddress}
                autoComplete="street-address"
                onChange={(event) => {
                  setSaved(false)
                  setShowroomAddress(event.target.value)
                }}
              />
            </Field>
            <Field label={t("seller.phone")} htmlFor="store-phone">
              <AuthInput
                id="store-phone"
                className="h-10 text-[14px]"
                type="tel"
                value={phone}
                autoComplete="tel"
                onChange={(event) => {
                  setSaved(false)
                  setPhone(event.target.value)
                }}
              />
            </Field>
          </div>
          <p className="mt-3 text-[12px] text-navy-muted">{t("seller.hoursSoonHint")}</p>
          {error ? (
            <p className="mt-3 text-[13px] text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 text-[13px] text-brand" role="status">
              {t("seller.profileSaved")}
            </p>
          ) : null}
          <div className="mt-4">
            <Button type="submit" className="h-10 w-full px-4 py-2 text-[14px] sm:w-auto" disabled={loading}>
              {loading ? t("form.saving") : t("seller.saveProfile")}
            </Button>
          </div>
        </form>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <h2 className="text-[16px] font-semibold text-navy">{t("seller.businessInfo")}</h2>
          <dl className="mt-3 space-y-2.5">
            <div>
              <dt className="text-[12px] text-navy-muted">{t("seller.verificationStatus")}</dt>
              <dd className="mt-1">
                <SellerStatusBadge
                  status={profile.status}
                  label={approved ? t("listing.verifiedSeller") : undefined}
                />
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-navy-muted">{t("seller.businessType")}</dt>
              <dd className="mt-0.5 text-[14px] font-medium text-navy">{businessTypeLabel(locale, profile.businessType)}</dd>
            </div>
            {profile.nib ? (
              <div>
                <dt className="text-[12px] text-navy-muted">NIB</dt>
                <dd className="mt-0.5 break-all text-[14px] font-medium text-navy">{profile.nib}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-3 text-[13px] leading-relaxed text-navy-muted">{t("seller.businessDocsHint")}</p>
          {approved ? (
            <p className="mt-2 text-[12px] text-navy-muted">{t("seller.nibLocked")}</p>
          ) : (
            <p className="mt-2 text-[12px] text-navy-muted">{t("seller.nibUntil")}</p>
          )}
          <p className="mt-2 text-[12px] text-navy-muted">{t("seller.logoSoonHint")}</p>
        </section>
      </div>
    </SellerCenterLayout>
  )
}
