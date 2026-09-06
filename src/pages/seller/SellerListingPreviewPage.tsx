import { useNavigate, useParams } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getAvailableStock } from "../../lib/inventory"
import { emptyListingForm, formatAvailableQuantity, formatIDR, validateListingForm } from "../../lib/listingForm"
import { canManageListing, getListingById, publishListing, toCatalogListing } from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import { useListingsLive } from "../../lib/useListingsLive"
import { ImageGallery } from "../../components/browse/ImageGallery"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"

export function SellerListingPreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useListingsLive()

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

  const listingId = listing.id
  const sellerId = user.id

  const profile = getSellerProfile(user.id)
  if (!profile) return null
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
    ["Condition", catalog.condition ?? "—"],
    ["Brand", catalog.brand ?? "—"],
    ["Model", catalog.model ?? "—"],
    ["Quantity", String(getAvailableStock(listing))],
  ]

  async function handlePublish() {
    const errors = validateListingForm(emptyListingForm(profile, listing))
    if (Object.keys(errors).length > 0) {
      navigate(`/seller/listings/${listingId}/edit`)
      return
    }
    const published = await publishListing(listingId, sellerId)
    if (!published) {
      navigate("/seller/dashboard")
      return
    }
    navigate("/seller/listings", { state: { published: true } })
  }

  return (
    <main className="bg-white pb-16 sm:pb-20">
      <Container className="pt-8 sm:pt-10">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-navy">Preview — Not Published</p>
          <p className="mt-1 text-sm text-navy-muted">This is how buyers will see your motorcycle on Motodo.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
              Back to Edit
            </Button>
            <Button onClick={() => void handlePublish()}>Publish Listing</Button>
          </div>
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
            <h1 className="text-3xl font-bold tracking-tight text-navy">{catalog.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand">{formatIDR(listing.price)}</p>
            <p className="mt-2 text-sm text-navy-muted">{formatAvailableQuantity(getAvailableStock(listing))}</p>
            <p className="mt-3 text-sm text-navy-muted">
              {catalog.year} · {catalog.mileage} · {catalog.location} · {catalog.category}
            </p>
            <div className="mt-8 rounded-2xl border border-line px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Seller</p>
              <p className="mt-1 text-base font-semibold text-navy">{catalog.seller.name}</p>
              {catalog.seller.verified ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy">
                  <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                  Verified Seller
                </p>
              ) : null}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Location</dt>
                  <dd className="font-medium text-navy">{catalog.seller.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Member since</dt>
                  <dd className="font-medium text-navy">{catalog.seller.memberSince}</dd>
                </div>
              </dl>
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
    </main>
  )
}
