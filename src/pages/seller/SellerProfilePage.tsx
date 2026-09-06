import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import { SellerNav } from "../../components/seller/SellerNav"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { businessTypeLabel, useLanguage } from "../../i18n"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value || "—"}</dd>
    </div>
  )
}

export function SellerProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useSellerLive()
  const profile = user ? getSellerProfile(user.id) : null
  const { locale, t } = useLanguage()

  if (!user) return null
  if (!profile) return <Navigate to="/profile" replace />
  if (searchParams.get("edit") === "1") return <Navigate to="/seller/profile/edit" replace />

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.profile")}</h1>
            <SellerStatusBadge status={profile.status} />
          </div>
          <p className="mt-2 text-navy-muted">{t("seller.profileSubtitle")}</p>
          <SellerNav approved={profile.status === "approved"} />

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <dl className="space-y-4">
              <Row label={t("seller.businessName")} value={profile.businessName} />
              <Row label={t("seller.sellerName")} value={profile.fullName} />
              <Row label={t("seller.businessType")} value={businessTypeLabel(locale, profile.businessType)} />
              <Row label="NIB" value={profile.nib} />
              <Row label={t("orders.city")} value={profile.city} />
              <Row label={t("seller.showroomAddress")} value={profile.showroomAddress} />
              <Row label={t("seller.phone")} value={profile.phone} />
              <Row label={t("auth.email")} value={profile.email} />
              <Row label={t("seller.website")} value={profile.website ?? ""} />
              <Row label={t("seller.businessHours")} value={profile.businessHours ?? ""} />
              <Row label={t("seller.businessDesc")} value={profile.description} />
              <Row label={t("orders.sellerFleet")} value={profile.sellerFleetAvailable ? t("seller.fleetOffered") : t("seller.fleetNotOffered")} />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-sm text-navy-muted">{t("seller.verificationStatus")}</dt>
                <dd>
                  <SellerStatusBadge status={profile.status} />
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/seller/profile/edit")}>{t("seller.editProfile")}</Button>
              <Button variant="secondary" onClick={() => navigate("/seller/dashboard")}>
                {t("nav.sellerDashboard")}
              </Button>
            </div>
          </section>
        </div>
      </Container>
    </main>
  )
}
