import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { approveSeller, getSellerProfileById, rejectSeller } from "../../lib/seller"
import { formatShortDate } from "../../lib/profile"
import { useSellerLive } from "../../lib/useSellerLive"
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

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value || "—"}</dd>
    </div>
  )
}

export function AdminSellerDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  const seller = id ? getSellerProfileById(id) : null
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState(false)

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

  const sellerId = seller.id

  if (approved) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container>
          <div className="mx-auto max-w-lg rounded-2xl border border-line px-6 py-10 text-center">
            <h1 className="text-2xl font-bold text-navy">Seller approved</h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted">
              {seller.businessName} can now list motorcycles on Motodo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/seller/dashboard")}>Go to Seller Dashboard</Button>
              <Button variant="secondary" onClick={() => navigate("/admin/sellers")}>
                Back to sellers
              </Button>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  async function handleApprove() {
    if (!user) return
    setBusy(true)
    try {
      await approveSeller(sellerId, user.id)
      setApproved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="text-sm">
            <Link to="/admin/sellers" className="font-medium text-brand hover:text-brand-hover">
              Seller Verification
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{seller.businessName}</h1>
            <SellerStatusBadge status={seller.status} />
          </div>

          <div className="mt-8 grid gap-4">
            <Section title="Contact Information">
              <Row label="Full Name" value={seller.fullName} />
              <Row label="Email" value={seller.email} />
              <Row label="Phone" value={seller.phone} />
            </Section>
            <Section title="Business Information">
              <Row label="Business / Garage Name" value={seller.businessName} />
              <Row label="Business Type" value={seller.businessType} />
              <Row label="NIB" value={seller.nib} />
              <Row label="Year Established" value={seller.yearEstablished} />
            </Section>
            <Section title="Showroom">
              <Row label="City" value={seller.city} />
              <Row label="Showroom Address" value={seller.showroomAddress} />
              <Row label="Postal Code" value={seller.postalCode} />
            </Section>
            <Section title="Online Presence">
              <Row label="Instagram" value={seller.instagram} />
              <Row label="Website" value={seller.website} />
            </Section>
            <Section title="About">
              <div>
                <dt className="text-sm text-navy-muted">Business Description</dt>
                <dd className="mt-2 text-sm leading-relaxed text-navy">{seller.description}</dd>
              </div>
            </Section>
            <Section title="Status">
              <Row label="Current verification status" value={seller.status} />
              <Row label="Registered" value={formatShortDate(seller.createdAt)} />
              {seller.reviewedAt ? <Row label="Reviewed" value={formatShortDate(seller.reviewedAt)} /> : null}
              {seller.rejectionReason ? <Row label="Rejection reason" value={seller.rejectionReason} /> : null}
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
            navigate("/admin/sellers")
          }}
        />
      ) : null}
    </main>
  )
}
