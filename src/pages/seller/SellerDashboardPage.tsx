import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { getSellerProfile } from "../../lib/seller"
import { getSellerListingCounts } from "../../lib/listings"
import { getUnreadCount } from "../../lib/chat"
import { useSellerLive } from "../../lib/useSellerLive"
import { useListingsLive } from "../../lib/useListingsLive"
import { useChatLive } from "../../lib/useChatLive"
import { UnreadBadge } from "../../components/chat/UnreadBadge"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"

export function SellerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useListingsLive()
  useChatLive()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />

  if (profile.status === "pending") {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Dashboard</h1>
              <SellerStatusBadge status={profile.status} />
            </div>
            <div className="mt-8 rounded-2xl border border-line px-5 py-8 sm:px-6">
              <h2 className="text-xl font-bold text-navy">Your seller account is under review.</h2>
              <p className="mt-3 text-sm leading-relaxed text-navy-muted">
                Once your seller profile is approved, you will be able to list motorcycles on Motodo.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/seller/profile")}>View Seller Profile</Button>
                <Button variant="secondary" onClick={() => navigate("/profile")}>
                  Back to My Profile
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  if (profile.status === "rejected") {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Dashboard</h1>
              <SellerStatusBadge status={profile.status} />
            </div>
            <div className="mt-8 rounded-2xl border border-line px-5 py-8 sm:px-6">
              <h2 className="text-xl font-bold text-navy">Your seller registration was not approved.</h2>
              {profile.rejectionReason ? (
                <p className="mt-3 text-sm leading-relaxed text-navy">{profile.rejectionReason}</p>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/seller/register")}>Edit Registration</Button>
                <Button variant="secondary" onClick={() => navigate("/profile")}>
                  Back to My Profile
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  const counts = getSellerListingCounts(user.id)
  const sellerUnread = getUnreadCount(user.id, "seller")

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Dashboard</h1>
            <SellerStatusBadge status={profile.status} label="Verified Seller" />
          </div>

          <div className="mt-6 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <p className="text-sm text-navy-muted">Business Name</p>
            <p className="mt-1 text-lg font-semibold text-navy">{profile.businessName}</p>
            <p className="mt-4 text-sm text-navy-muted">Verification Status</p>
            <p className="mt-1 font-medium text-navy">Verified Seller</p>
            <Button className="mt-6" onClick={() => navigate("/seller/listings/new")}>
              Add Motorcycle
            </Button>
          </div>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">My Listings</h2>
            <p className="mt-3 text-sm text-navy-muted">
              {counts.active} Active
              <br />
              {counts.draft} Draft
              <br />
              {counts.sold} Sold
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/seller/listings")}>Manage Listings</Button>
              <Button variant="secondary" onClick={() => navigate("/seller/listings/new")}>
                Add Motorcycle
              </Button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Messages</h2>
            <p className="mt-2 text-sm text-navy-muted">Reply to buyers who enquire about your motorcycles.</p>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={() => navigate("/seller/messages")}>Messages</Button>
              <UnreadBadge count={sellerUnread} />
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Seller Profile</h2>
            <p className="mt-2 text-sm text-navy-muted">View and update your garage details.</p>
            <Button className="mt-4" onClick={() => navigate("/seller/profile")}>
              View Seller Profile
            </Button>
          </section>
        </div>
      </Container>
    </main>
  )
}
