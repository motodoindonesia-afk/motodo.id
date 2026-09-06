import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { approveSeller, getSellerProfileById, rejectSeller } from "../../lib/seller"
import { SellerDataGate } from "../../components/seller/SellerDataGate"
import { formatMoney, getSellerRevenue, sellerRowStats } from "../../lib/adminPlatform"
import { formatShortDate } from "../../lib/profile"
import { SELLER_SUCCESS_FEE_RATE } from "../../lib/orders"
import { publicSellerPath } from "../../lib/sellers"
import { useSellerLive } from "../../lib/useSellerLive"
import { useListingsLive } from "../../lib/useListingsLive"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { AdminNav } from "../../components/admin/AdminNav"
import { RejectSellerModal } from "../../components/admin/RejectSellerModal"
import { SellerStatusBadge } from "../../components/seller/SellerStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import type { ReactNode } from "react"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <dl className="mt-4 space-y-3">{children}</dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value?: string | number | ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value === undefined || value === null || value === "" ? "—" : value}</dd>
    </div>
  )
}

export function AdminSellerDetailPage() {
  return (
    <SellerDataGate>
      <AdminSellerDetailInner />
    </SellerDataGate>
  )
}

function AdminSellerDetailInner() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useListingsLive()
  useOrdersLive()
  useReviewsLive()
  const seller = id ? getSellerProfileById(id) : null
  const [rejectOpen, setRejectOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  if (!seller) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold text-navy">Seller not found</h1>
            <Button className="mt-6" onClick={() => navigate("/admin/sellers")}>
              Back to sellers
            </Button>
          </div>
        </Container>
      </main>
    )
  }

  const stats = sellerRowStats(seller)
  const revenue = getSellerRevenue(seller.userId)
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)
  const sellerId = seller.id

  async function handleApprove() {
    if (!user) return
    setBusy(true)
    try {
      await approveSeller(sellerId, user.id)
      setMessage("Seller approved.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to approve seller.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <AdminNav />
          <p className="mt-6 text-sm">
            <Link to="/admin/sellers" className="font-medium text-brand hover:text-brand-hover">
              ← Sellers
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-navy">{seller.businessName}</h2>
            <SellerStatusBadge status={seller.status} />
          </div>
          {message ? (
            <p className="mt-3 text-sm text-brand" role="status">
              {message}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4">
            <Section title="Business Information">
              <Row label="Business / Garage Name" value={seller.businessName} />
              <Row label="Business Type" value={seller.businessType} />
              <Row label="NIB" value={seller.nib} />
              <Row label="Year Established" value={seller.yearEstablished} />
              <Row label="Website" value={seller.website} />
              <Row label="Business Hours" value={seller.businessHours} />
              <div>
                <dt className="text-sm text-navy-muted">Business Description</dt>
                <dd className="mt-2 text-sm leading-relaxed text-navy">{seller.description}</dd>
              </div>
            </Section>
            <Section title="Seller Information">
              <Row label="Seller Name" value={seller.fullName} />
              <Row label="Email" value={seller.email} />
              <Row label="Phone" value={seller.phone} />
              <Row label="City" value={seller.city} />
              <Row label="Showroom Address" value={seller.showroomAddress} />
              <Row label="Postal Code" value={seller.postalCode} />
            </Section>
            <Section title="Verification Status">
              <Row label="Status" value={<SellerStatusBadge status={seller.status} />} />
              <Row label="Registered" value={formatShortDate(seller.createdAt)} />
              {seller.reviewedAt ? <Row label="Reviewed" value={formatShortDate(seller.reviewedAt)} /> : null}
              {seller.rejectionReason ? <Row label="Rejection reason" value={seller.rejectionReason} /> : null}
              {seller.status === "approved" ? (
                <Row
                  label="Public store"
                  value={
                    <Link to={publicSellerPath(seller.userId)} className="text-brand hover:text-brand-hover">
                      View public store
                    </Link>
                  }
                />
              ) : null}
            </Section>
            <Section title="Seller Statistics">
              <Row label="Active Listings" value={stats.activeListings} />
              <Row label="Sold Listings" value={stats.soldListings} />
              <Row label="Orders" value={stats.orders} />
              <Row label="Completed Transactions" value={stats.completed} />
              <Row label="Average Rating" value={stats.rating ?? "No reviews yet."} />
              <Row label="Total Reviews" value={stats.reviews} />
            </Section>
            <Section title="Seller Financials">
              <Row label="Gross Transaction Value" value={formatMoney(revenue.grossTransactionValue)} />
              <Row label={`Motodo Success Fee (${feePercent}%)`} value={formatMoney(revenue.motodoSuccessFee)} />
              <Row label="Seller Net Amount" value={formatMoney(revenue.sellerNetAmount)} />
            </Section>
          </div>

          {seller.status === "pending" ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Admin review</h2>
              <p className="mt-2 text-sm text-navy-muted">Approve this seller or reject with a reason.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => void handleApprove()} disabled={busy}>
                  {busy ? "Approving..." : "Approve Seller"}
                </Button>
                <Button
                  variant="secondary"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setRejectOpen(true)}
                  disabled={busy}
                >
                  Reject Seller
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Container>

      {rejectOpen ? (
        <RejectSellerModal
          businessName={seller.businessName}
          onCancel={() => setRejectOpen(false)}
          onConfirm={async (reason) => {
            if (!user) return
            await rejectSeller(seller.id, user.id, reason)
            setRejectOpen(false)
          }}
        />
      ) : null}
    </main>
  )
}
