import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { formatAvailableQuantity, formatIDR } from "../../lib/listingForm"
import {
  canManageListing,
  deleteListing,
  getListingById,
  listingStatusLabel,
  markListingAsActive,
  markListingAsSold,
  toCatalogListing,
} from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import { useListingsLive } from "../../lib/useListingsLive"
import { ConfirmListingModal } from "../../components/seller/ConfirmListingModal"
import { DeleteListingModal } from "../../components/seller/DeleteListingModal"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
import { ImageGallery } from "../../components/browse/ImageGallery"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"

export function SellerListingViewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useListingsLive()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [soldOpen, setSoldOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(false)

  if (!user) return null
  const listing = id ? getListingById(id) : null
  if (!listing) {
    return <SellerListingAccessMessage title="Listing not found" onBack={() => navigate("/seller/listings")} />
  }
  if (!canManageListing(listing, user.id)) {
    return (
      <SellerListingAccessMessage
        title="You don't have permission to access this listing."
        onBack={() => navigate("/seller/listings")}
      />
    )
  }

  const profile = getSellerProfile(user.id)
  const catalog = toCatalogListing(listing, profile)
  const gallery = catalog.images.length > 0 ? catalog.images : catalog.image ? [catalog.image] : []
  const specs = [
    ["Year", String(catalog.year || "—")],
    ["Mileage", catalog.mileage],
    ["Engine", catalog.engine],
    ["Transmission", catalog.transmission],
    ["Fuel", catalog.fuel],
    ["Color", catalog.color],
    ["Category", catalog.category],
    ["Location", catalog.location],
    ["Showroom Address", listing.showroomAddress || "—"],
    ["Condition", catalog.condition ?? "—"],
    ["Brand", catalog.brand ?? "—"],
    ["Model", catalog.model ?? "—"],
    ["Status", listingStatusLabel(listing.status)],
    ["Quantity", String(listing.quantity)],
  ]

  return (
    <main className="bg-white pb-16 sm:pb-20">
      <Container className="pt-8 sm:pt-10">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-navy">Seller View</p>
          <p className="mt-1 text-sm text-navy-muted">This page is only visible to you as the listing owner.</p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          {gallery.length > 0 ? (
            <ImageGallery images={gallery} alt={catalog.name} />
          ) : (
            <div className="flex aspect-[16/11] items-center justify-center rounded-2xl bg-surface text-sm text-navy-muted">
              No photos
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              {listingStatusLabel(listing.status)}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy">{catalog.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand">{formatIDR(listing.price)}</p>
            <p className="mt-2 text-sm text-navy-muted">{formatAvailableQuantity(listing.quantity)}</p>
            <p className="mt-3 text-sm text-navy-muted">
              {catalog.year} · {catalog.mileage} · {catalog.location} · {catalog.category}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>Edit Listing</Button>
              {listing.status === "active" ? (
                <Button variant="secondary" onClick={() => setSoldOpen(true)}>
                  Mark as Sold
                </Button>
              ) : null}
              {listing.status === "sold" ? (
                <Button variant="secondary" onClick={() => setActiveOpen(true)}>
                  Mark as Active
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Listing
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/listings")}>
                Back to My Listings
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy">Specifications</h2>
          <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {specs.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                <dt className="text-sm text-navy-muted">{label}</dt>
                <dd className="text-sm font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy">Description</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-navy-muted">{catalog.description}</p>
        </section>
      </Container>

      {deleteOpen ? (
        <DeleteListingModal
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            await deleteListing(listing.id, user.id)
            navigate("/seller/listings")
          }}
        />
      ) : null}
      {soldOpen ? (
        <ConfirmListingModal
          title="Mark as Sold"
          message="Mark this motorcycle as sold?"
          confirmLabel="Mark as Sold"
          onCancel={() => setSoldOpen(false)}
          onConfirm={async () => {
            await markListingAsSold(listing.id, user.id)
            setSoldOpen(false)
          }}
        />
      ) : null}
      {activeOpen ? (
        <ConfirmListingModal
          title="Mark as Active"
          message="Mark this motorcycle as active again?"
          confirmLabel="Mark as Active"
          onCancel={() => setActiveOpen(false)}
          onConfirm={async () => {
            await markListingAsActive(listing.id, user.id)
            setActiveOpen(false)
          }}
        />
      ) : null}
    </main>
  )
}
