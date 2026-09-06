import { Check, MessageSquare, Share2, ShieldCheck, Truck } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CompactRating } from "../components/reviews/CompactRating"
import { ReviewCard } from "../components/reviews/ReviewCard"
import { Container } from "../components/layout/Container"
import { Button } from "../components/ui/Button"
import { MotorcycleCard } from "../components/ui/MotorcycleCard"
import { SearchBar } from "../components/ui/SearchBar"
import { useAuth } from "../context/AuthContext"
import { startBuyerConversation } from "../lib/chat"
import { formatMotorcycleCount } from "../lib/browse"
import { getPublicListingById } from "../lib/listings"
import { cn } from "../lib/cn"
import { formatAverageRating, getSellerRatingSummary } from "../lib/reviews"
import {
  filterSellerStoreListings,
  getPublicSellerProfile,
  getPublicSellerReviews,
  getSellerActiveListings,
  getSellerCompletedOrders,
  publicSellerPath,
  sellerMemberSinceLabel,
  sortSellerStoreListings,
  websiteHref,
} from "../lib/sellers"
import { useListingsLive } from "../lib/useListingsLive"
import { useOrdersLive } from "../lib/useOrdersLive"
import { useReviewsLive } from "../lib/useReviewsLive"
import { useSellerLive } from "../lib/useSellerLive"
import { MOTORCYCLE_CATEGORIES, type MotorcycleCategory } from "../types/marketplace"
import type { PublicSellerSort } from "../types/publicSeller"

const SORT_OPTIONS: { value: PublicSellerSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

export function PublicSellerPage() {
  const { sellerId = "" } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  useSellerLive()
  useListingsLive()
  useReviewsLive()
  useOrdersLive()

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<MotorcycleCategory | "All">("All")
  const [sort, setSort] = useState<PublicSellerSort>("newest")
  const [selectedListingId, setSelectedListingId] = useState("")
  const [chatNote, setChatNote] = useState("")
  const [shareNote, setShareNote] = useState("")
  const profile = getPublicSellerProfile(sellerId)

  useEffect(() => {
    setQuery("")
    setCategory("All")
    setSort("newest")
    setSelectedListingId("")
    setChatNote("")
    setShareNote("")
  }, [sellerId])

  const listings = profile ? getSellerActiveListings(profile.userId) : []
  const reviews = profile ? getPublicSellerReviews(profile.userId) : []
  const ratingSummary = profile ? getSellerRatingSummary(profile.userId) : { average: null, count: 0 }
  const average = ratingSummary.average
  const completedCount = profile ? getSellerCompletedOrders(profile.userId) : 0
  const previewReviews = reviews.slice(0, 5)
  const memberSince = profile ? sellerMemberSinceLabel(profile) : null

  const visibleListings = useMemo(
    () => sortSellerStoreListings(filterSellerStoreListings(listings, query, category), sort),
    [listings, query, category, sort],
  )

  useEffect(() => {
    if (listings.length === 1) {
      setSelectedListingId(listings[0].id)
      return
    }
    if (selectedListingId && !listings.some((item) => item.id === selectedListingId)) {
      setSelectedListingId("")
    }
  }, [listings, selectedListingId])

  if (!profile) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Seller not found</h1>
          <p className="mt-3 text-navy-muted">This seller profile is unavailable or the link is incorrect.</p>
          <Link to="/browse" className="mt-8 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            Return to Browse
          </Link>
        </Container>
      </main>
    )
  }

  const approved = profile.status === "approved"
  const isOwnStore = Boolean(user && user.id === profile.userId)
  const storePath = publicSellerPath(profile.userId)
  const businessName = profile.businessName

  async function shareStore() {
    const url = `${window.location.origin}${storePath}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: businessName,
          text: `View ${businessName} on Motodo`,
          url,
        })
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareNote("Link copied")
    } catch {
      setShareNote("Copy the URL from your browser")
    }
    window.setTimeout(() => setShareNote(""), 2500)
  }

  async function handleChatSeller() {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(storePath)}`)
      return
    }
    if (isOwnStore) {
      setChatNote("You cannot chat with your own store.")
      return
    }
    if (!approved || listings.length === 0) {
      setChatNote("Select a motorcycle to start a conversation.")
      return
    }
    if (!selectedListingId) {
      setChatNote("Select a motorcycle to start a conversation.")
      return
    }
    if (!user) return
    const listing = getPublicListingById(selectedListingId)
    if (!listing) {
      setChatNote("This listing is no longer available.")
      return
    }
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
            <li className="text-navy">{profile.businessName}</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-2xl border border-line bg-white px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">{profile.businessName}</h1>
              {approved ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                  <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                  Verified Seller
                </p>
              ) : profile.status === "pending" ? (
                <p className="mt-2 text-sm text-navy-muted">Pending verification</p>
              ) : null}
              {profile.city ? (
                <p className="mt-2 text-base text-navy-muted">
                  {profile.city}
                  {approved ? ", Indonesia" : null}
                </p>
              ) : null}
              {approved ? (
                <div className="mt-4">
                  <CompactRating average={average} count={ratingSummary.count} emptyLabel="No reviews yet." />
                  <p className="mt-1 text-sm text-navy-muted">{formatMotorcycleCount(listings.length)}</p>
                </div>
              ) : null}
              {memberSince && approved ? <p className="mt-2 text-sm text-navy-muted">{memberSince}</p> : null}
            </div>
            {approved ? (
              <div className="flex w-full flex-col gap-3 sm:max-w-xs lg:w-72">
                {listings.length > 1 ? (
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-navy">Motorcycle</span>
                    <select
                      className="h-11 rounded-lg border border-line bg-white px-3 text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                      value={selectedListingId}
                      onChange={(event) => {
                        setSelectedListingId(event.target.value)
                        setChatNote("")
                      }}
                    >
                      <option value="">Select a motorcycle</option>
                      {listings.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <Button className="w-full px-5 py-3" onClick={handleChatSeller}>
                  <MessageSquare className="size-4" aria-hidden="true" />
                  Chat Seller
                </Button>
                <Button variant="secondary" className="w-full px-5 py-3" onClick={() => void shareStore()}>
                  <Share2 className="size-4" aria-hidden="true" />
                  Share
                </Button>
                {chatNote ? (
                  <p className="text-sm text-navy" role="status">
                    {chatNote}
                  </p>
                ) : null}
                {shareNote ? (
                  <p className="text-xs text-navy-muted" role="status">
                    {shareNote}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        {profile.status === "pending" ? (
          <p className="mt-8 rounded-2xl border border-line bg-surface px-5 py-8 text-center text-navy-muted">
            This seller profile is currently under verification.
          </p>
        ) : null}

        {profile.status === "rejected" ? (
          <p className="mt-8 rounded-2xl border border-line bg-surface px-5 py-8 text-center text-navy-muted">
            This seller profile is currently unavailable.
          </p>
        ) : null}

        {approved ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-line px-5 py-5 lg:col-span-2">
                <h2 className="text-lg font-bold text-navy">Seller Information</h2>
                {profile.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-navy-muted">{profile.description}</p>
                ) : null}
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <InfoRow label="Business Name" value={profile.businessName} />
                  {profile.city ? <InfoRow label="City" value={`${profile.city}, Indonesia`} /> : null}
                  {profile.showroomAddress ? <InfoRow label="Showroom Address" value={profile.showroomAddress} /> : null}
                  {profile.phone ? (
                    <InfoRow
                      label="Phone"
                      value={
                        <a className="font-medium text-brand hover:text-brand-hover" href={`tel:${profile.phone}`}>
                          {profile.phone}
                        </a>
                      }
                    />
                  ) : null}
                  {profile.website ? (
                    <InfoRow
                      label="Website"
                      value={
                        <a
                          className="font-medium text-brand hover:text-brand-hover"
                          href={websiteHref(profile.website)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {profile.website}
                        </a>
                      }
                    />
                  ) : null}
                  {profile.businessHours ? <InfoRow label="Business Hours" value={profile.businessHours} /> : null}
                </dl>
              </section>

              <aside className="grid gap-6">
                <section className="rounded-2xl border border-line px-5 py-5">
                  <h2 className="text-lg font-bold text-navy">Store Stats</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <Stat label="Active Motorcycles" value={String(listings.length)} />
                    <Stat label="Completed Orders" value={String(completedCount)} />
                    <Stat label="Seller Rating" value={formatAverageRating(average) ?? "—"} />
                    <Stat label="Total Reviews" value={String(ratingSummary.count)} />
                  </dl>
                  <p className="mt-4 text-sm text-navy-muted">
                    {completedCount} completed {completedCount === 1 ? "transaction" : "transactions"}
                  </p>
                </section>

                <section className="rounded-2xl border border-line px-5 py-5">
                  <h2 className="text-lg font-bold text-navy">Delivery Options</h2>
                  <ul className="mt-4 space-y-2 text-sm text-navy">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-brand" aria-hidden="true" />
                      Pickup at Showroom
                    </li>
                    {profile.sellerFleetAvailable ? (
                      <li className="flex items-center gap-2">
                        <Truck className="size-4 text-brand" aria-hidden="true" />
                        Seller Fleet
                      </li>
                    ) : null}
                    <li className="flex items-center gap-2 text-navy-muted">
                      <span className="size-4" aria-hidden="true" />
                      Third-Party Logistics · Coming Soon
                    </li>
                  </ul>
                  {profile.sellerFleetAvailable ? (
                    <div className="mt-4 rounded-xl bg-surface px-4 py-3">
                      <p className="text-sm font-medium text-navy">Seller Fleet Available</p>
                      <p className="mt-1 text-sm text-navy-muted">
                        Delivery can be arranged directly through the seller.
                      </p>
                    </div>
                  ) : null}
                </section>
              </aside>
            </div>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold text-navy sm:text-2xl">Customer Reviews</h2>
                {reviews.length > 5 ? (
                  <Link
                    to={`${storePath}/reviews`}
                    className="text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    View All Reviews
                  </Link>
                ) : null}
              </div>
              {previewReviews.length === 0 ? (
                <p className="mt-4 text-sm text-navy-muted">No reviews yet.</p>
              ) : (
                <div className="mt-5 grid gap-4">
                  {previewReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-12 sm:mt-14">
              <h2 className="text-xl font-bold text-navy sm:text-2xl">Motorcycles for Sale</h2>
              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
                <SearchBar
                  id="seller-store-search"
                  className="w-full lg:max-w-md"
                  value={query}
                  placeholder="Search this seller's motorcycles"
                  onChange={setQuery}
                />
                <label className="flex items-center gap-2 text-sm text-navy lg:ml-auto">
                  <span className="shrink-0 text-navy-muted">Sort</span>
                  <select
                    className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as PublicSellerSort)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Category">
                {(["All", ...MOTORCYCLE_CATEGORIES] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium",
                      category === item ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                    )}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {listings.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-line px-5 py-10 text-center text-sm text-navy-muted">
                  No motorcycles currently available.
                </p>
              ) : visibleListings.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-line px-5 py-10 text-center text-sm text-navy-muted">
                  No motorcycles currently available.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleListings.map((item) => (
                    <MotorcycleCard key={item.id} listing={item} href={`/motorcycles/${item.id}`} showCategory />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </Container>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div>
      <dt className="text-navy-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy">{value}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-navy-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-navy">{value}</dd>
    </div>
  )
}
