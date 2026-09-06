import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"
import { SellerNav } from "../../components/seller/SellerNav"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"

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

  if (!user) return null
  if (!profile) return <Navigate to="/profile" replace />
  if (searchParams.get("edit") === "1") return <Navigate to="/seller/profile/edit" replace />

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Profile</h1>
            <SellerStatusBadge status={profile.status} />
          </div>
          <p className="mt-2 text-navy-muted">Your garage and showroom details on Motodo.</p>
          <SellerNav approved={profile.status === "approved"} />

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <dl className="space-y-4">
              <Row label="Business Name" value={profile.businessName} />
              <Row label="Seller Name" value={profile.fullName} />
              <Row label="Business Type" value={profile.businessType} />
              <Row label="NIB" value={profile.nib} />
              <Row label="City" value={profile.city} />
              <Row label="Showroom Address" value={profile.showroomAddress} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Email" value={profile.email} />
              <Row label="Website" value={profile.website ?? ""} />
              <Row label="Business Hours" value={profile.businessHours ?? ""} />
              <Row label="Business Description" value={profile.description} />
              <Row label="Seller Fleet" value={profile.sellerFleetAvailable ? "Available" : "Not offered"} />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-sm text-navy-muted">Verification Status</dt>
                <dd>
                  <SellerStatusBadge status={profile.status} />
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/seller/profile/edit")}>Edit Seller Profile</Button>
              <Button variant="secondary" onClick={() => navigate("/seller/dashboard")}>
                Seller Dashboard
              </Button>
            </div>
          </section>
        </div>
      </Container>
    </main>
  )
}
