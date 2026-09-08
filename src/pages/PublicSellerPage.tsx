import { MessageSquare, Share2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CompactRating } from "../components/reviews/CompactRating"
import { Container } from "../components/layout/Container"
import { UserAvatar } from "../components/profile/UserAvatar"
import { SellerStatusBadge } from "../components/seller/SellerStatusBadge"
import { Button } from "../components/ui/Button"
import { ListingCardSkeleton } from "../components/ui/ListingCardSkeleton"
import { MotorcycleCard } from "../components/ui/MotorcycleCard"
import { useAuth } from "../context/AuthContext"
import { startBuyerConversation } from "../lib/chat"
import { useLanguage } from "../i18n"
import { getPublicListingById, isListingsReady } from "../lib/listings"
import { cn } from "../lib/cn"
import { getSellerRatingSummary, isReviewsReady } from "../lib/reviews"
import {
  getPublicSellerProfile,
  getSellerActiveListings,
  publicSellerPath,
  sortSellerStoreListings,
} from "../lib/sellers"
import { useListingsLive } from "../lib/useListingsLive"
import { useReviewsLive } from "../lib/useReviewsLive"
import { useSellerLive } from "../lib/useSellerLive"
import type { PublicSellerSort } from "../types/publicSeller"

type SortChip = {
  id: string
  sort: PublicSellerSort
  labelKey: "browse.all" | "browse.sort.newest" | "seller.sortPriceLow" | "seller.sortPriceHigh"
}

const SORT_CHIPS: SortChip[] = [
  { id: "all", sort: "newest", labelKey: "browse.all" },
  { id: "newest", sort: "newest", labelKey: "browse.sort.newest" },
  { id: "price-asc", sort: "price-asc", labelKey: "seller.sortPriceLow" },
  { id: "price-desc", sort: "price-desc", labelKey: "seller.sortPriceHigh" },
]

export function PublicSellerPage() {
  const { sellerId = "" } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  useSellerLive()
  useListingsLive()
  useReviewsLive()

  const listingsReady = isListingsReady()
  const reviewsReady = isReviewsReady()
  const ready = listingsReady && reviewsReady

  const [sortChip, setSortChip] = useState("all")
  const [selectedListingId, setSelectedListingId] = useState("")
  const [chatNote, setChatNote] = useState("")
  const [shareNote, setShareNote] = useState("")
  const profile = ready ? getPublicSellerProfile(sellerId) : null

  useEffect(() => {
    setSortChip("all")
    setSelectedListingId("")
    setChatNote("")
    setShareNote("")
  }, [sellerId])

  const listings = profile ? getSellerActiveListings(profile.userId) : []
  const ratingSummary = profile ? getSellerRatingSummary(profile.userId) : { average: null, count: 0 }
  const activeSort = SORT_CHIPS.find((chip) => chip.id === sortChip)?.sort ?? "newest"
  const visibleListings = useMemo(
    () => sortSellerStoreListings(listings, activeSort),
    [listings, activeSort],
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

  if (!ready) {
    return <StorefrontSkeleton />
  }

  if (!profile) {
    return (
      <main className="overflow-x-hidden bg-surface py-16">
        <Container className="max-w-xl text-center">
          <h1 className="text-[20px] font-semibold tracking-tight text-navy">{t("seller.notFound")}</h1>
          <p className="mt-2 text-[14px] text-navy-muted">{t("seller.notFoundBody")}</p>
          <Link to="/browse" className="mt-6 inline-flex text-[14px] font-medium text-brand hover:text-brand-hover">
            {t("listing.returnBrowse")}
          </Link>
        </Container>
      </main>
    )
  }

  const isOwnStore = Boolean(user && user.id === profile.userId)
  const storePath = publicSellerPath(profile.userId)
  const businessName = profile.businessName
  const hasRating = ratingSummary.count > 0 && ratingSummary.average != null
  const showMetrics = listings.length > 0 || hasRating

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
    if (listings.length === 0) {
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
      setChatNote(started.error === "self" ? t("listing.cannotChatSelf") : t("listing.unavailable"))
      return
    }
    navigate(`/messages/${started.conversation.id}`, { replace: true })
  }

  return (
    <main className="overflow-x-hidden bg-surface pb-12">
      <Container className="py-4 min-[1024px]:py-6">
        <nav className="text-[13px] text-navy-muted" aria-label={t("listing.breadcrumb")}>
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
            <li className="min-w-0 break-words text-navy">{profile.businessName}</li>
          </ol>
        </nav>

        <section className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-card min-[1024px]:p-5">
          <div className="flex items-start gap-3">
            <UserAvatar name={profile.businessName} size="md" className="size-12 rounded-lg text-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 break-words text-[20px] font-semibold tracking-tight text-navy">
                  {profile.businessName}
                </h1>
                <SellerStatusBadge status="approved" label={t("listing.verifiedSeller")} />
              </div>
              {profile.city ? <p className="mt-0.5 text-[13px] text-navy-muted">{profile.city}</p> : null}
            </div>
          </div>
          {profile.description ? (
            <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-navy-muted">{profile.description}</p>
          ) : null}

          {showMetrics ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-navy">
              {listings.length > 0 ? (
                <p>
                  <span className="font-semibold">{listings.length}</span>{" "}
                  <span className="text-navy-muted">{t("seller.storeMotors")}</span>
                </p>
              ) : null}
              {hasRating ? (
                <CompactRating average={ratingSummary.average} count={ratingSummary.count} emptyLabel="" />
              ) : null}
            </div>
          ) : null}

          {hasRating ? (
            <Link
              to={`${storePath}/reviews`}
              className="mt-2 inline-flex text-[13px] font-medium text-brand hover:text-brand-hover"
            >
              {t("seller.viewAllReviews")}
            </Link>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {listings.length > 1 ? (
              <label className="grid min-w-0 flex-1 gap-1 text-[13px] sm:max-w-xs">
                <span className="font-medium text-navy">{t("orders.motorcycle")}</span>
                <select
                  className="h-10 rounded-lg border border-line bg-white px-3 text-[14px] text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
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
            <Button className="h-10 px-4 py-2 text-[14px]" onClick={() => void handleChatSeller()}>
              <MessageSquare className="size-4" aria-hidden="true" />
              {t("listing.chatSeller")}
            </Button>
            <Button variant="secondary" className="h-10 px-4 py-2 text-[14px]" onClick={() => void shareStore()}>
              <Share2 className="size-4" aria-hidden="true" />
              {t("listing.share")}
            </Button>
          </div>
          {chatNote ? (
            <p className="mt-2 text-[13px] text-navy" role="status">
              {chatNote}
            </p>
          ) : null}
          {shareNote ? (
            <p className="mt-2 text-[12px] text-navy-muted" role="status">
              {shareNote}
            </p>
          ) : null}
        </section>

        <section className="mt-4">
          <h2 className="text-[16px] font-semibold text-navy">{t("seller.storeMotors")}</h2>
          {listings.length > 0 ? (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("browse.sort")}>
              {SORT_CHIPS.map((chip) => {
                const active = sortChip === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                      active ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-navy hover:border-brand/40",
                    )}
                    onClick={() => setSortChip(chip.id)}
                  >
                    {t(chip.labelKey)}
                  </button>
                )
              })}
            </div>
          ) : null}

          {listings.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-line bg-white px-4 py-8 text-center shadow-card">
              <p className="text-[14px] font-medium text-navy">{t("seller.storeEmptyTitle")}</p>
              <p className="mt-1 text-[13px] text-navy-muted">{t("seller.storeEmptyBody")}</p>
              {isOwnStore ? (
                <Link
                  to="/seller/listings"
                  className="mt-3 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[14px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t("seller.manageListings")}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 min-[769px]:gap-3 lg:grid-cols-3">
              {visibleListings.map((item) => (
                <MotorcycleCard key={item.id} listing={item} href={`/motorcycles/${item.id}`} showCategory />
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  )
}

function StorefrontSkeleton() {
  return (
    <main className="overflow-x-hidden bg-surface pb-12" aria-busy="true">
      <Container className="py-4 min-[1024px]:py-6">
        <div className="h-4 w-40 animate-pulse rounded bg-white" />
        <div className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex gap-3">
            <div className="size-12 shrink-0 animate-pulse rounded-lg bg-surface" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded bg-surface" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
            </div>
          </div>
          <div className="mt-4 h-10 w-36 animate-pulse rounded-lg bg-surface" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 min-[769px]:gap-3 lg:grid-cols-3">
          <ListingCardSkeleton />
          <ListingCardSkeleton />
          <ListingCardSkeleton />
          <ListingCardSkeleton />
        </div>
      </Container>
    </main>
  )
}
