import { CalendarDays, LayoutGrid, MapPin, MessageSquare, Share2, ShieldCheck, Star } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Container } from "../components/layout/Container"
import { SellerStoreBanner } from "../components/seller/SellerStoreBanner"
import { Button } from "../components/ui/Button"
import { ListingCardSkeleton } from "../components/ui/ListingCardSkeleton"
import { MotorcycleCard } from "../components/ui/MotorcycleCard"
import { useAuth } from "../context/AuthContext"
import { startBuyerConversation } from "../lib/chat"
import { useLanguage } from "../i18n"
import { getPublicListingById, isListingsReady } from "../lib/listings"
import { ensureSellerListingCard } from "../lib/listingsSupabase"
import { cn } from "../lib/cn"
import { getSellerRatingSummary, formatAverageRating, isReviewsReady } from "../lib/reviews"
import { nameInitials } from "../lib/profile"
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

  useEffect(() => {
    void ensureSellerListingCard(sellerId)
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
          <h1 className="text-heading font-semibold tracking-tight text-navy">{t("seller.notFound")}</h1>
          <p className="mt-2 text-[13px] text-navy-muted">{t("seller.notFoundBody")}</p>
          <Link to="/browse" className="mt-6 inline-flex text-ui font-medium text-brand hover:text-brand-hover">
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
  const joinedYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : NaN
  const coverUrl = profile.store_cover_url
  const storeMetrics = [
    ...(hasRating && ratingSummary.average != null && formatAverageRating(ratingSummary.average)
      ? [
          {
            key: "rating",
            icon: <Star className="size-4 text-amber-200" aria-hidden="true" />,
            value: formatAverageRating(ratingSummary.average) ?? "",
            label: t("listing.metricRating"),
            detail:
              ratingSummary.count === 1 ? t("review.countOne") : t("review.countMany", { count: ratingSummary.count }),
          },
        ]
      : []),
    {
      key: "listings",
      icon: <LayoutGrid className="size-4 text-white" aria-hidden="true" />,
      value: String(listings.length),
      label: t("listing.metricListings"),
    },
    ...(!Number.isNaN(joinedYear)
      ? [
          {
            key: "joined",
            icon: <CalendarDays className="size-4 text-white" aria-hidden="true" />,
            value: String(joinedYear),
            label: t("listing.metricJoined"),
          },
        ]
      : []),
  ]

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
        <nav className="text-[12px] text-navy-muted" aria-label={t("listing.breadcrumb")}>
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

        <section className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <SellerStoreBanner
            coverUrl={coverUrl}
            metrics={storeMetrics}
            identity={
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/90 text-ui font-semibold text-brand">
                  {nameInitials(businessName)}
                </span>
                <div className="min-w-0">
                  <h1 className="min-w-0 break-words text-ui font-semibold text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">
                    {businessName}
                  </h1>
                  <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-meta text-brand">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {t("listing.verifiedSeller")}
                  </p>
                  {profile.city ? (
                    <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-meta text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">
                      <MapPin className="size-3 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">{profile.city}</span>
                    </p>
                  ) : null}
                  {!Number.isNaN(joinedYear) ? (
                    <p className="mt-1 text-meta text-white/95 drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">
                      {t("listing.memberSince")} {joinedYear}
                    </p>
                  ) : null}
                </div>
              </div>
            }
            actions={
              <div className="flex min-w-0 flex-wrap gap-2">
                <Button className="h-9 px-3 py-1.5 text-ui" onClick={() => void handleChatSeller()}>
                  <MessageSquare className="size-4" aria-hidden="true" />
                  {t("listing.chatSeller")}
                </Button>
                <Button
                  variant="secondary"
                  className="h-9 border-white/50 bg-white/90 px-3 py-1.5 text-ui hover:bg-white"
                  onClick={() => void shareStore()}
                >
                  <Share2 className="size-4" aria-hidden="true" />
                  {t("listing.share")}
                </Button>
              </div>
            }
          />
          <div className="p-4 min-[1024px]:p-5">
          {profile.description ? (
            <p className="line-clamp-4 text-[13px] leading-relaxed text-navy-muted">{profile.description}</p>
          ) : null}

          {hasRating ? (
            <Link
              to={`${storePath}/reviews`}
              className="mt-2 inline-flex text-ui font-medium text-brand hover:text-brand-hover"
            >
              {t("seller.viewAllReviews")}
            </Link>
          ) : null}

          {listings.length > 1 ? (
            <label className="mt-4 grid min-w-0 gap-1 text-[12px] sm:max-w-xs">
              <span className="font-medium text-navy">{t("orders.motorcycle")}</span>
              <select
                className="h-10 rounded-lg border border-line bg-white px-3 text-[13px] text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
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
          {chatNote ? (
            <p className="mt-2 text-[12px] text-navy" role="status">
              {chatNote}
            </p>
          ) : null}
          {shareNote ? (
            <p className="mt-2 text-meta text-navy-muted" role="status">
              {shareNote}
            </p>
          ) : null}
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-section font-semibold text-navy">{t("seller.storeMotors")}</h2>
          {listings.length > 0 ? (
            <div className="mt-2 flex min-w-0 flex-wrap gap-1.5" role="group" aria-label={t("browse.sort")}>
              {SORT_CHIPS.map((chip) => {
                const active = sortChip === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-ui font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
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
              <p className="text-ui font-medium text-navy">{t("seller.storeEmptyTitle")}</p>
              <p className="mt-1 text-[12px] text-navy-muted">{t("seller.storeEmptyBody")}</p>
              {isOwnStore ? (
                <Link
                  to="/seller/listings"
                  className="mt-3 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-ui font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
