import { Heart, Share2, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getPublicListingById, getRelatedPublicListings } from "../../lib/listings"
import { isSupabaseConfigured } from "../../lib/supabase"
import { ensureRemoteListing } from "../../lib/listingsSupabase"
import { coerceListingQuantity, formatAvailableQuantity } from "../../lib/listingForm"
import { startBuyerConversation } from "../../lib/chat"
import { useListingsLive } from "../../lib/useListingsLive"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import { MotorcycleCard } from "../ui/MotorcycleCard"
import { Container } from "../layout/Container"
import { ContactSellerModal } from "./ContactSellerModal"
import { ImageGallery } from "./ImageGallery"
import { ListingReviewsSection } from "../reviews/ListingReviewsSection"
import { CompactRating } from "../reviews/CompactRating"
import { getListingRatingSummary, getSellerRatingSummary } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { publicSellerPath } from "../../lib/sellers"

export function MotorcycleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  useListingsLive()
  useReviewsLive()
  const listing = id ? getPublicListingById(id) : undefined
  const [saved, setSaved] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [shareNote, setShareNote] = useState("")
  const [chatNote, setChatNote] = useState("")

  useEffect(() => {
    if (!id || !isSupabaseConfigured() || listing) return
    void ensureRemoteListing(id)
  }, [id, listing])

  useEffect(() => {
    setSaved(false)
    setContactOpen(false)
    setShareNote("")
    setChatNote("")
  }, [id])

  async function shareListing() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareNote("Link copied")
    } catch {
      setShareNote("Copy the URL from your browser")
    }
    window.setTimeout(() => setShareNote(""), 2500)
  }

  async function handleChatSeller() {
    if (!listing) return
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/motorcycles/${listing.id}`)}`)
      return
    }
    if (!user) return
    const started = await startBuyerConversation(listing, user.id)
    if ("error" in started) {
      if (started.error === "self") {
        setChatNote("You cannot chat with yourself about your own listing.")
      } else {
        setChatNote("This listing is no longer available.")
      }
      return
    }
    navigate(`/messages/${started.conversation.id}`, { replace: true })
  }

  if (!listing) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Motorcycle not found</h1>
          <p className="mt-3 text-navy-muted">
            This listing is unavailable or the link is incorrect.
          </p>
          <Link
            to="/browse"
            className="mt-8 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
          >
            Return to Browse
          </Link>
        </Container>
      </main>
    )
  }

  const currentListing = listing
  const related = getRelatedPublicListings(currentListing, 4)
  const gallery = currentListing.images.length > 0 ? currentListing.images : [currentListing.image]
  const available = currentListing.status === "sold" ? 0 : coerceListingQuantity(currentListing.quantity)
  const soldOut = currentListing.status === "sold" || available <= 0
  const isOwnListing = Boolean(user && currentListing.sellerId === user.id)
  const buyDisabled = soldOut || currentListing.status === "draft" || isOwnListing

  function handleBuyNow() {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/checkout/${currentListing.id}`)}`)
      return
    }
    if (isOwnListing) {
      setChatNote("You cannot purchase your own listing.")
      return
    }
    if (buyDisabled) return
    navigate(`/checkout/${currentListing.id}`)
  }

  return (
    <main className="bg-white pb-16 sm:pb-20">
      <Container className="pt-8 sm:pt-10">
        <nav className="text-sm text-navy-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-brand">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/browse" className="hover:text-brand">
                Browse
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-navy">{listing.name}</li>
          </ol>
        </nav>

        <Link
          to="/browse"
          className="mt-5 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to Browse
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <ImageGallery images={gallery} alt={listing.name} />

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                {soldOut ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy">SOLD OUT</p>
                ) : null}
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy sm:text-[2rem]">
                  {listing.name}
                </h1>
                <p className="mt-2 text-2xl font-semibold text-brand">{listing.price}</p>
                <div className="mt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Motorcycle Rating</p>
                  <CompactRating
                    average={getListingRatingSummary(listing.id).average}
                    count={getListingRatingSummary(listing.id).count}
                    emptyLabel="No reviews yet."
                  />
                </div>
                {soldOut ? (
                  <p className="mt-2 text-sm font-medium text-navy">SOLD OUT</p>
                ) : (
                  <p className="mt-2 text-sm text-navy-muted">{formatAvailableQuantity(listing.quantity)}</p>
                )}
                <p className="mt-3 text-sm text-navy-muted">
                  {listing.year} · {listing.location} · {listing.category}
                </p>
                {soldOut ? (
                  <p className="mt-3 text-sm text-navy-muted">This motorcycle is no longer available.</p>
                ) : null}
              </div>
              {soldOut ? null : (
                <button
                  type="button"
                  aria-pressed={saved}
                  aria-label={saved ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
                  onClick={() => setSaved((value) => !value)}
                  className="mt-1 rounded-full border border-line p-2.5 text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <Heart className="size-5" fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
                </button>
              )}
            </div>

            {soldOut ? (
              <div className="mt-7 rounded-2xl border border-line bg-surface px-5 py-4">
                <p className="text-sm font-semibold text-navy">SOLD OUT</p>
                <p className="mt-1 text-sm text-navy-muted">This motorcycle has already been sold.</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 px-5 py-3" disabled>
                    Buy Now
                  </Button>
                  <Button variant="secondary" className="flex-1 px-5 py-3" onClick={handleChatSeller}>
                    Chat Seller
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1 px-5 py-3" disabled={buyDisabled} onClick={handleBuyNow}>
                  Buy Now
                </Button>
                <Button variant="secondary" className="flex-1 px-5 py-3" onClick={handleChatSeller}>
                  Chat Seller
                </Button>
                <Button variant="secondary" className="flex-1 px-5 py-3" onClick={() => setContactOpen(true)}>
                  Contact Seller
                </Button>
                <Button variant="secondary" className="sm:min-w-32" onClick={() => void shareListing()}>
                  <Share2 className="size-4" aria-hidden="true" />
                  Share
                </Button>
              </div>
            )}
            {isOwnListing ? (
              <p className="mt-2 text-sm text-navy" role="status">
                You cannot purchase your own listing.
              </p>
            ) : null}
            {chatNote ? (
              <p className="mt-2 text-sm text-navy" role="status">
                {chatNote}
              </p>
            ) : null}
            {shareNote ? (
              <p className="mt-2 text-xs text-navy-muted" role="status">
                {shareNote}
              </p>
            ) : null}

            <div className="mt-8 rounded-2xl border border-line bg-white px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Seller</p>
                  <Link
                    to={publicSellerPath(listing.sellerId)}
                    className="mt-1 inline-block text-base font-semibold text-navy hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {listing.seller.name}
                  </Link>
                  {listing.seller.verified ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy">
                      <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                      Verified Seller
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-navy-muted">Seller</p>
                  )}
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">Seller Rating</p>
                    <CompactRating
                      average={getSellerRatingSummary(listing.sellerId).average}
                      count={getSellerRatingSummary(listing.sellerId).count}
                      emptyLabel="No seller reviews yet."
                    />
                  </div>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Location</dt>
                  <dd className="font-medium text-navy">{listing.seller.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">Member since</dt>
                  <dd className="font-medium text-navy">{listing.seller.memberSince}</dd>
                </div>
              </dl>
              <Button className="mt-5 w-full" onClick={handleChatSeller}>
                Chat Seller
              </Button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-navy-muted">
              Never send payment before verifying the motorcycle and seller.
            </p>
          </div>
        </div>

        <section className="mt-12 sm:mt-14">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Details</h2>
          <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {[
              ["Year", listing.year],
              ["Mileage", listing.mileage],
              ["Engine", listing.engine],
              ["Transmission", listing.transmission],
              ["Fuel", listing.fuel],
              ["Color", listing.color],
              ["Category", listing.category],
              ["Location", listing.location],
              ...(listing.condition ? [["Condition", listing.condition] as const] : []),
              ...(listing.brand ? [["Brand", listing.brand] as const] : []),
              ...(listing.model ? [["Model", listing.model] as const] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                <dt className="text-sm text-navy-muted">{label}</dt>
                <dd className="text-sm font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 sm:mt-14">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Description</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-navy-muted">
            {listing.description}
          </p>
        </section>

        <ListingReviewsSection listingId={listing.id} />

        {related.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-xl font-bold text-navy sm:text-2xl">Similar Motorcycles</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <MotorcycleCard
                  key={item.id}
                  listing={item}
                  href={`/motorcycles/${item.id}`}
                  showCategory
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      {contactOpen ? (
        <ContactSellerModal listing={listing} onClose={() => setContactOpen(false)} />
      ) : null}
    </main>
  )
}
