import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AdminNav } from "../../components/admin/AdminNav"
import { ConfirmActionModal } from "../../components/admin/ConfirmActionModal"
import { ImageGallery } from "../../components/browse/ImageGallery"
import { CompactRating } from "../../components/reviews/CompactRating"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { listingStockSummary } from "../../lib/inventory"
import { formatIDR, formatMileageKm } from "../../lib/listingForm"
import { adminSetListingStatus, getListingForAdmin, listingStatusLabel } from "../../lib/listings"
import { getSellerRatingSummary } from "../../lib/reviews"
import { getSellerProfile, statusLabel } from "../../lib/seller"
import { publicSellerPath } from "../../lib/sellers"
import { useListingsLive } from "../../lib/useListingsLive"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { useSellerLive } from "../../lib/useSellerLive"

export function AdminListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  useListingsLive()
  useSellerLive()
  useReviewsLive()
  const listing = listingId ? getListingForAdmin(listingId) : null
  const [confirmHide, setConfirmHide] = useState(false)
  const [message, setMessage] = useState("")

  if (!listing) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-navy">Listing not found</h1>
          <Button className="mt-6" onClick={() => navigate("/admin/listings")}>
            Back to listings
          </Button>
        </Container>
      </main>
    )
  }

  const seller = getSellerProfile(listing.sellerId)
  const images = listing.images.length > 0 ? listing.images : []
  const sellerRating = getSellerRatingSummary(listing.sellerId)
  const currentListingId = listing.id
  const stock = listingStockSummary(listing)

  function hideListing() {
    const next = adminSetListingStatus(currentListingId, "draft")
    setConfirmHide(false)
    if (next) setMessage("Listing hidden from public browse.")
  }

  function approveListing() {
    const next = adminSetListingStatus(currentListingId, "active")
    if (!next) setMessage("This listing cannot be published (available stock must be at least 1).")
    else setMessage("Listing set to active.")
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <AdminNav />
          <p className="mt-6 text-sm">
            <Link to="/admin/listings" className="font-medium text-brand hover:text-brand-hover">
              ← Listings
            </Link>
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">{listing.name}</h2>
          <p className="mt-2 text-sm text-navy-muted">Status: {listingStatusLabel(listing.status)}</p>
          {message ? (
            <p className="mt-3 text-sm text-brand" role="status">
              {message}
            </p>
          ) : null}

          {images.length > 0 ? (
            <div className="mt-6 max-w-xl">
              <ImageGallery images={images} alt={listing.name} />
            </div>
          ) : null}

          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {[
              ["Brand", listing.brand],
              ["Model", listing.model],
              ["Category", listing.category],
              ["Price", formatIDR(listing.price)],
              ["Stock", String(stock.total)],
              ["Reserved", String(stock.reserved)],
              ["Available", String(stock.available)],
              ["Condition", listing.condition],
              ["Year", String(listing.year)],
              ["Mileage", formatMileageKm(listing.mileage)],
              ["Engine", listing.engine],
              ["Transmission", listing.transmission],
              ["Fuel", listing.fuel],
              ["Color", listing.color],
              ["City", listing.city],
              ["Location", listing.location],
              ["Showroom Address", listing.showroomAddress],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                <dt className="text-sm text-navy-muted">{label}</dt>
                <dd className="text-sm font-medium text-navy">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6">
            <h3 className="text-lg font-bold text-navy">Description</h3>
            <p className="mt-3 text-sm leading-relaxed text-navy-muted">{listing.description}</p>
          </section>

          <section className="mt-6 rounded-2xl border border-line px-5 py-6">
            <h3 className="text-lg font-bold text-navy">Seller</h3>
            <p className="mt-2 font-medium text-navy">{seller?.businessName ?? "Unknown seller"}</p>
            <p className="mt-1 text-sm text-navy-muted">{seller ? statusLabel(seller.status) : "No seller profile"}</p>
            <div className="mt-2">
              <CompactRating
                average={sellerRating.average}
                count={sellerRating.count}
                emptyLabel="No seller reviews yet."
              />
            </div>
            {seller ? (
              <Link to={publicSellerPath(seller.userId)} className="mt-3 inline-block text-sm font-medium text-brand">
                View public store
              </Link>
            ) : null}
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {listing.status === "active" ? (
              <Button variant="secondary" onClick={() => setConfirmHide(true)}>
                Hide listing
              </Button>
            ) : listing.status === "draft" ? (
              <Button onClick={approveListing}>Approve listing</Button>
            ) : null}
          </div>
        </div>
      </Container>

      {confirmHide ? (
        <ConfirmActionModal
          title="Hide listing"
          description="This listing will be set to draft and removed from public Browse. It will not be deleted."
          confirmLabel="Hide listing"
          onCancel={() => setConfirmHide(false)}
          onConfirm={hideListing}
        />
      ) : null}
    </main>
  )
}
