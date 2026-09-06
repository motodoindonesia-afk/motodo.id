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
import { categoryLabel, sortOptionLabel, useLanguage } from "../i18n"
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

const SORT_OPTIONS: { value: PublicSellerSort }[] = [
  { value: "newest" },
  { value: "price-asc" },
  { value: "price-desc" },
]

export function PublicSellerPage() {
  const { sellerId = "" } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { locale, t } = useLanguage()
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
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.notFound")}</h1>
          <p className="mt-3 text-navy-muted">{t("seller.notFoundBody")}</p>
          <Link to="/browse" className="mt-8 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            {t("listing.returnBrowse")}
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
          text: t("seller.shareText", { name: businessName }),
          url,
        })
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareNote(t("listing.linkCopied"))
    } catch {
      setShareNote(t("listing.copyUrl"))
    }
    window.setTimeout(() => setShareNote(""), 2500)
  }

  async function handleChatSeller() {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(storePath)}`)
      return
    }
    if (isOwnStore) {
      setChatNote(t("seller.chatOwn"))
      return
    }
    if (!approved || listings.length === 0) {
      setChatNote(t("seller.selectToChat"))
      return
    }
    if (!selectedListingId) {
      setChatNote(t("seller.selectToChat"))
      return
    }
    if (!user) return
    const listing = getPublicListingById(selectedListingId)
    if (!listing) {
      setChatNote(t("listing.unavailable"))
      return
    }
    const started = await startBuyerConversation(listing, user.id)
    if ("error" in started) {
      if (started.error === "self") {
        setChatNote(t("listing.cannotChatSelf"))
      } else {
        setChatNote(t("listing.unavailable"))
      }
      return
    }
    navigate(`/messages/${started.conversation.id}`, { replace: true })
  }

  return (
    <main className="bg-white pb-16 sm:pb-20">
      <Container className="pt-8 sm:pt-10">
        <nav className="text-sm text-navy-muted" aria-label={t("listing.breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-brand">
                {t("common.home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/browse" className="hover:text-brand">
                {t("nav.browse")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-navy">{profile.businessName}</li>
          </ol>
        </nav>

        <header className="mt-6 rounded-2xl border border-line bg-white px-5 py-6 shadow-card sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">{profile.businessName}</h1>
              {approved ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                  <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                  {t("listing.verifiedSeller")}
                </p>
              ) : profile.status === "pending" ? (
                <p className="mt-2 text-sm text-navy-muted">{t("seller.pendingBadge")}</p>
              ) : null}
              {profile.city ? (
                <p className="mt-2 text-base text-navy-muted">
                  {approved ? t("seller.cityIndonesia", { city: profile.city }) : profile.city}
                </p>
              ) : null}
              {approved ? (
                <div className="mt-4">
                  <CompactRating average={average} count={ratingSummary.count} emptyLabel={t("listing.noReviews")} />
                  <p className="mt-1 text-sm text-navy-muted">
                    {listings.length === 1 ? t("browse.countOne") : t("browse.countMany", { count: listings.length })}
                  </p>
                </div>
              ) : null}
              {memberSince && approved ? (
                <p className="mt-2 text-sm text-navy-muted">
                  {profile.createdAt && !Number.isNaN(new Date(profile.createdAt).getFullYear())
                    ? t("seller.memberSinceYear", { year: new Date(profile.createdAt).getFullYear() })
                    : memberSince}
                </p>
              ) : null}
            </div>
            {approved ? (
              <div className="flex w-full flex-col gap-3 sm:max-w-xs lg:w-72">
                {listings.length > 1 ? (
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-navy">{t("orders.motorcycle")}</span>
                    <select
                      className="h-11 rounded-lg border border-line bg-white px-3 text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                      value={selectedListingId}
                      onChange={(event) => {
                        setSelectedListingId(event.target.value)
                        setChatNote("")
                      }}
                    >
                      <option value="">{t("seller.selectMotorcycle")}</option>
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
                  {t("listing.chatSeller")}
                </Button>
                <Button variant="secondary" className="w-full px-5 py-3" onClick={() => void shareStore()}>
                  <Share2 className="size-4" aria-hidden="true" />
                  {t("listing.share")}
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
            {t("seller.underVerification")}
          </p>
        ) : null}

        {profile.status === "rejected" ? (
          <p className="mt-8 rounded-2xl border border-line bg-surface px-5 py-8 text-center text-navy-muted">
            {t("seller.unavailable")}
          </p>
        ) : null}

        {approved ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-line px-5 py-5 lg:col-span-2">
                <h2 className="text-lg font-bold text-navy">{t("seller.info")}</h2>
                {profile.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-navy-muted">{profile.description}</p>
                ) : null}
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <InfoRow label={t("seller.businessName")} value={profile.businessName} />
                  {profile.city ? <InfoRow label={t("orders.city")} value={t("seller.cityIndonesia", { city: profile.city })} /> : null}
                  {profile.showroomAddress ? <InfoRow label={t("seller.showroomAddress")} value={profile.showroomAddress} /> : null}
                  {profile.phone ? (
                    <InfoRow
                      label={t("seller.phone")}
                      value={
                        <a className="font-medium text-brand hover:text-brand-hover" href={`tel:${profile.phone}`}>
                          {profile.phone}
                        </a>
                      }
                    />
                  ) : null}
                  {profile.website ? (
                    <InfoRow
                      label={t("seller.website")}
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
                  {profile.businessHours ? <InfoRow label={t("seller.businessHours")} value={profile.businessHours} /> : null}
                </dl>
              </section>

              <aside className="grid gap-6">
                <section className="rounded-2xl border border-line px-5 py-5">
                  <h2 className="text-lg font-bold text-navy">{t("seller.storeStats")}</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <Stat label={t("seller.activeMotorcycles")} value={String(listings.length)} />
                    <Stat label={t("seller.completedOrders")} value={String(completedCount)} />
                    <Stat label={t("listing.sellerRating")} value={formatAverageRating(average) ?? "—"} />
                    <Stat label={t("seller.totalReviews")} value={String(ratingSummary.count)} />
                  </dl>
                  <p className="mt-4 text-sm text-navy-muted">
                    {completedCount === 1
                      ? t("seller.txOne", { count: completedCount })
                      : t("seller.txMany", { count: completedCount })}
                  </p>
                </section>

                <section className="rounded-2xl border border-line px-5 py-5">
                  <h2 className="text-lg font-bold text-navy">{t("seller.deliveryOptions")}</h2>
                  <ul className="mt-4 space-y-2 text-sm text-navy">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-brand" aria-hidden="true" />
                      {t("orders.pickupShowroom")}
                    </li>
                    {profile.sellerFleetAvailable ? (
                      <li className="flex items-center gap-2">
                        <Truck className="size-4 text-brand" aria-hidden="true" />
                        {t("orders.sellerFleet")}
                      </li>
                    ) : null}
                    <li className="flex items-center gap-2 text-navy-muted">
                      <span className="size-4" aria-hidden="true" />
                      {t("seller.thirdSoon")}
                    </li>
                  </ul>
                  {profile.sellerFleetAvailable ? (
                    <div className="mt-4 rounded-xl bg-surface px-4 py-3">
                      <p className="text-sm font-medium text-navy">{t("seller.fleetAvailable")}</p>
                      <p className="mt-1 text-sm text-navy-muted">
                        {t("seller.fleetArrange")}
                      </p>
                    </div>
                  ) : null}
                </section>
              </aside>
            </div>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("seller.customerReviews")}</h2>
                {reviews.length > 5 ? (
                  <Link
                    to={`${storePath}/reviews`}
                    className="text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    {t("seller.viewAllReviews")}
                  </Link>
                ) : null}
              </div>
              {previewReviews.length === 0 ? (
                <p className="mt-4 text-sm text-navy-muted">{t("listing.noReviews")}</p>
              ) : (
                <div className="mt-5 grid gap-4">
                  {previewReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-12 sm:mt-14">
              <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("seller.forSale")}</h2>
              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
                <SearchBar
                  id="seller-store-search"
                  className="w-full lg:max-w-md"
                  value={query}
                  placeholder={t("seller.searchPlaceholder")}
                  onChange={setQuery}
                />
                <label className="flex items-center gap-2 text-sm text-navy lg:ml-auto">
                  <span className="shrink-0 text-navy-muted">{t("browse.sort")}</span>
                  <select
                    className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as PublicSellerSort)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {sortOptionLabel(locale, option.value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("browse.category")}>
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
                    {item === "All" ? t("browse.all") : categoryLabel(locale, item)}
                  </button>
                ))}
              </div>

              {listings.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-line px-5 py-10 text-center text-sm text-navy-muted">
                  {t("seller.noMotorcycles")}
                </p>
              ) : visibleListings.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-line px-5 py-10 text-center text-sm text-navy-muted">
                  {t("seller.noMotorcycles")}
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
