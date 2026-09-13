import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { categoryLabel, useLanguage } from "../../i18n"
import { cn } from "../../lib/cn"
import { ensureSellerListingCard } from "../../lib/listingsSupabase"
import { nameInitials } from "../../lib/profile"
import { formatAverageRating, getSellerRatingSummary } from "../../lib/reviews"
import {
  filterSellerStoreListings,
  getPublicSellerProfile,
  getSellerActiveListings,
  publicSellerPath,
} from "../../lib/sellers"
import { MOTORCYCLE_CATEGORIES, type MotorcycleCategory, type MotorcycleListing } from "../../types/marketplace"
import { SellerStoreBanner } from "../seller/SellerStoreBanner"
import { Button } from "../ui/Button"
import { MotorcycleCard } from "../ui/MotorcycleCard"
import { surfaceCard } from "../ui/surface"

const PREVIEW_LIMIT = 5

type Props = {
  listing: MotorcycleListing
  onChat: () => void
  chatNote?: string
}

export function ListingSellerPanel({ listing, onChat, chatNote }: Props) {
  const { locale, t } = useLanguage()
  const [descOpen, setDescOpen] = useState(false)
  const [tab, setTab] = useState<MotorcycleCategory | "All">("All")

  useEffect(() => {
    void ensureSellerListingCard(listing.sellerId)
  }, [listing.sellerId])

  const publicSeller = getPublicSellerProfile(listing.sellerId)
  const storePath = publicSellerPath(listing.sellerId)
  const sellerName = publicSeller?.businessName || listing.seller.name
  const sellerVerified = listing.seller.verified
  const sellerCity = publicSeller?.city || listing.seller.location
  const memberSince = listing.seller.memberSince
  const joinedYear = (() => {
    if (!publicSeller?.createdAt) return null
    const year = new Date(publicSeller.createdAt).getFullYear()
    return Number.isNaN(year) ? null : String(year)
  })()
  const sellerRating = getSellerRatingSummary(listing.sellerId)
  const ratingLabel = formatAverageRating(sellerRating.average)
  const hasRating = sellerRating.count > 0 && ratingLabel !== null
  const description = publicSeller?.description?.trim() ?? ""
  const longDescription = description.length > 180
  const listings = publicSeller ? getSellerActiveListings(publicSeller.userId) : []
  const coverUrl = publicSeller?.status === "approved" ? publicSeller.store_cover_url : null

  const categoryTabs = useMemo(
    () => MOTORCYCLE_CATEGORIES.filter((category) => listings.some((item) => item.category === category)),
    [listings],
  )

  useEffect(() => {
    setDescOpen(false)
    setTab("All")
  }, [listing.sellerId])

  useEffect(() => {
    if (tab !== "All" && !categoryTabs.includes(tab)) setTab("All")
  }, [tab, categoryTabs])

  const filtered = filterSellerStoreListings(listings, "", tab)
  const preview = filtered.slice(0, PREVIEW_LIMIT)
  const showTabs = listings.length > 0 && categoryTabs.length > 0
  const metrics: Array<{
    key: string
    icon: ReactNode
    value: string
    label: string
    detail?: string
  }> = []
  if (hasRating && ratingLabel) {
    metrics.push({
      key: "rating",
      icon: <Star className="size-4 text-amber-200" aria-hidden="true" />,
      value: ratingLabel,
      label: t("listing.metricRating"),
      detail: sellerRating.count === 1 ? t("review.countOne") : t("review.countMany", { count: sellerRating.count }),
    })
  }
  if (publicSeller) {
    metrics.push({
      key: "listings",
      icon: <LayoutGrid className="size-4 text-white" aria-hidden="true" />,
      value: String(listings.length),
      label: t("listing.metricListings"),
    })
  }
  if (joinedYear) {
    metrics.push({
      key: "joined",
      icon: <CalendarDays className="size-4 text-white" aria-hidden="true" />,
      value: joinedYear,
      label: t("listing.metricJoined"),
    })
  }

  return (
    <section className={surfaceCard("min-w-0 overflow-hidden p-0")}>
      <div className="flex min-w-0 items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="text-section font-semibold text-navy">{t("listing.sellerInfo")}</h2>
        <Link
          to={storePath}
          className="inline-flex shrink-0 items-center gap-0.5 text-meta font-medium text-brand hover:text-brand-hover"
        >
          {t("listing.viewAllMotors")}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-3 min-w-0 px-4 pb-0 sm:px-5">
        <SellerStoreBanner
          coverUrl={coverUrl}
          metrics={metrics}
          identity={
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-ui font-semibold text-brand">
                {nameInitials(sellerName)}
              </span>
              <div className="min-w-0">
                <p className="text-ui font-semibold text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">{sellerName}</p>
                {sellerVerified ? (
                  <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-meta text-brand">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    {t("listing.verifiedSeller")}
                  </p>
                ) : null}
                {sellerCity ? (
                  <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-meta text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">
                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{sellerCity}</span>
                  </p>
                ) : null}
                {memberSince ? (
                  <p className="mt-1 text-meta text-white/95 drop-shadow-[0_1px_2px_rgba(15,23,42,0.9)]">
                    {t("listing.memberSince")} {memberSince}
                  </p>
                ) : null}
              </div>
            </div>
          }
          actions={
            <div className="flex w-full min-w-0 max-w-sm flex-wrap gap-2">
              <Button className="min-w-0 flex-1 px-3 py-2 text-ui lg:flex-none" onClick={onChat}>
                <MessageCircle className="size-4" aria-hidden="true" />
                {t("listing.chatPenjual")}
              </Button>
              <Link
                to={storePath}
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/50 bg-white/90 px-3 py-2 text-ui font-medium text-navy hover:bg-white lg:flex-none"
              >
                <Store className="size-3.5" aria-hidden="true" />
                {t("listing.viewShop")}
              </Link>
            </div>
          }
        />
        {chatNote ? (
          <p className="mt-2 text-ui text-navy" role="status">
            {chatNote}
          </p>
        ) : null}
      </div>

      {description ? (
        <div className="mt-4 border-t border-line px-4 pt-3 sm:px-5">
          <p className="text-section font-semibold text-navy">{t("listing.sellerDescription")}</p>
          <p
            className={cn(
              "mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-navy-muted",
              !descOpen && longDescription && "line-clamp-3",
            )}
          >
            {description}
          </p>
          {longDescription ? (
            <button
              type="button"
              className="mt-1.5 inline-flex items-center gap-1 text-ui font-medium text-brand hover:text-brand-hover"
              onClick={() => setDescOpen((open) => !open)}
              aria-expanded={descOpen}
            >
              {descOpen ? t("listing.showLess") : t("listing.showMore")}
              <ChevronDown className={`size-3.5 transition-transform ${descOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-line px-4 pt-3 pb-4 sm:px-5">
        {showTabs ? (
          <div className="min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-1">
              <TabButton active={tab === "All"} onClick={() => setTab("All")}>
                {t("listing.allProducts")}
              </TabButton>
              {categoryTabs.map((category) => (
                <TabButton key={category} active={tab === category} onClick={() => setTab(category)}>
                  {categoryLabel(locale, category)}
                </TabButton>
              ))}
            </div>
          </div>
        ) : null}

        {listings.length === 0 ? (
          <p className="mt-3 text-ui text-navy-muted">{t("listing.sellerEmptyListings")}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
              {preview.map((item) => (
                <MotorcycleCard
                  key={item.id}
                  listing={item}
                  href={`/motorcycles/${item.id}`}
                  hideQuantity
                />
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <Link
                to={storePath}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface/60 px-4 py-2.5 text-ui font-medium text-brand hover:bg-surface"
              >
                {t("listing.viewAllFromSeller", { name: sellerName })}
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ui font-medium",
        active ? "bg-brand-soft text-brand" : "text-navy-muted hover:bg-surface hover:text-navy",
      )}
    >
      {children}
    </button>
  )
}
