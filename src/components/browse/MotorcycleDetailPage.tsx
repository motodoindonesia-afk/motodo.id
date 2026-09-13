import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Headphones,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { WishlistActionButton } from "../favorites/WishlistActionButton"
import { FavoriteHeartButton } from "../favorites/FavoriteHeartButton"
import { AddToCartButton } from "../cart/AddToCartButton"
import { getPublicListingById, getRelatedPublicListings } from "../../lib/listings"
import { isSupabaseConfigured } from "../../lib/supabase"
import { ensureRemoteListing } from "../../lib/listingsSupabase"
import { coerceListingQuantity, formatIDR } from "../../lib/listingForm"
import { isListingEligibleForCart } from "../../lib/platform/commerce"
import { isListingEligibleForSale } from "../../lib/platform/demoInventory"
import { userFacingMessage } from "../../lib/userFacingError"
import { availableQuantityLabel, catalogValue, categoryLabel, useLanguage } from "../../i18n"
import { startBuyerConversation } from "../../lib/chat"
import { useListingsLive } from "../../lib/useListingsLive"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { Button } from "../ui/Button"
import { MotorcycleCard } from "../ui/MotorcycleCard"
import { Container } from "../layout/Container"
import { ImageGallery } from "./ImageGallery"
import { ListingSellerPanel } from "./ListingSellerPanel"
import { ListingReviewsSection } from "../reviews/ListingReviewsSection"
import { CompactRating } from "../reviews/CompactRating"
import { getListingRatingSummary } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { getPublicSellerProfile } from "../../lib/sellers"
import { surfaceCard } from "../ui/surface"
import { MOTORCYCLE_CATEGORIES } from "../../types/marketplace"
import type { MotorcycleListing } from "../../types/marketplace"

function hasSpecValue(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return false
  if (value === "—" || value === "-") return false
  if (typeof value === "number" && !Number.isFinite(value)) return false
  if (typeof value === "number" && value <= 0) return false
  return true
}

function browseBrandHref(brand: string) {
  if ((MOTORCYCLE_CATEGORIES as readonly string[]).includes(brand)) {
    return `/browse?category=${encodeURIComponent(brand)}`
  }
  return `/browse?q=${encodeURIComponent(brand)}`
}

function SpecGrid({
  rows,
}: {
  rows: Array<{ label: string; value: string | number }>
}) {
  if (rows.length === 0) return null
  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-xl border border-line sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-b-0 sm:border-r sm:odd:border-r sm:even:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <dt className="text-meta text-navy-muted">{row.label}</dt>
          <dd className="text-right text-ui font-medium text-navy">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function InfoRow({
  icon,
  title,
  subtitle,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
}) {
  const body = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-ui font-semibold text-navy">{title}</span>
        <span className="mt-0.5 block whitespace-pre-line text-meta text-navy-muted">{subtitle}</span>
      </span>
      {action ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-meta font-medium text-brand">
          {action}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </>
  )

  if (onAction) {
    return (
      <button
        type="button"
        onClick={onAction}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {body}
      </button>
    )
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
      {body}
    </div>
  )
}

export function MotorcycleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { addListingToCart, hasListing, isPending } = useCart()
  const { locale, t } = useLanguage()
  useListingsLive()
  useReviewsLive()
  const listing = id ? getPublicListingById(id) : undefined
  const [shareNote, setShareNote] = useState("")
  const [chatNote, setChatNote] = useState("")
  const [buyError, setBuyError] = useState("")
  const [buying, setBuying] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [protectOpen, setProtectOpen] = useState(false)
  const buyNowStarted = useRef(false)
  const buyInFlight = useRef(false)

  useEffect(() => {
    if (!id || !isSupabaseConfigured() || listing) {
      setLookingUp(false)
      return
    }
    let cancelled = false
    setLookingUp(true)
    void ensureRemoteListing(id).finally(() => {
      if (!cancelled) setLookingUp(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, listing])

  useEffect(() => {
    setShareNote("")
    setChatNote("")
    setBuyError("")
    setBuying(false)
    setDescOpen(false)
    setSimOpen(false)
    setProtectOpen(false)
    buyNowStarted.current = false
    buyInFlight.current = false
  }, [id])

  const addToCartThenGoToCart = useCallback(
    async (target: MotorcycleListing) => {
      if (buyInFlight.current) return
      setBuyError("")
      if (!isListingEligibleForCart(target, user?.id)) {
        setBuyError(t("cart.addError"))
        return
      }
      buyInFlight.current = true
      setBuying(true)
      try {
        if (!hasListing(target.id)) {
          await addListingToCart(target.id)
        }
        navigate("/cart")
      } catch (error) {
        setBuyError(userFacingMessage(error, t("cart.addError")))
      } finally {
        buyInFlight.current = false
        setBuying(false)
      }
    },
    [addListingToCart, hasListing, navigate, t, user?.id],
  )

  useEffect(() => {
    if (searchParams.get("buyNow") !== "1") return
    if (!isAuthenticated || !listing) return
    if (buyNowStarted.current) return
    const ownListing = Boolean(user && listing.sellerId === user.id)
    if (
      ownListing ||
      listing.status === "draft" ||
      listing.status === "sold" ||
      !isListingEligibleForSale(listing) ||
      !isListingEligibleForCart(listing, user?.id)
    ) {
      setSearchParams({}, { replace: true })
      return
    }
    buyNowStarted.current = true
    setSearchParams({}, { replace: true })
    void addToCartThenGoToCart(listing)
  }, [addToCartThenGoToCart, isAuthenticated, listing, searchParams, setSearchParams, user])

  async function shareListing() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareNote(t("listing.linkCopied"))
    } catch {
      setShareNote(t("listing.copyUrl"))
    }
    window.setTimeout(() => setShareNote(""), 2500)
  }

  async function handleChatSeller(target: MotorcycleListing) {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/motorcycles/${target.id}`)}`)
      return
    }
    if (!user) return
    const started = await startBuyerConversation(target, user.id)
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

  if (!listing && lookingUp) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">{t("common.loading")}</p>
      </main>
    )
  }

  if (!listing) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-heading font-bold tracking-tight text-navy">{t("listing.notFound")}</h1>
          <p className="mt-3 text-navy-muted">{t("listing.notFoundBody")}</p>
          <Link to="/browse" className="mt-8 inline-flex text-sm font-medium text-brand hover:text-brand-hover">
            {t("listing.returnBrowse")}
          </Link>
        </Container>
      </main>
    )
  }

  const currentListing = listing
  const related = getRelatedPublicListings(currentListing, 8)
  const gallery = currentListing.images.length > 0 ? currentListing.images : currentListing.image ? [currentListing.image] : []
  const available = currentListing.status === "sold" ? 0 : coerceListingQuantity(currentListing.quantity)
  const soldOut = currentListing.status === "sold" || available <= 0
  const isOwnListing = Boolean(user && currentListing.sellerId === user.id)
  const saleEligible = isListingEligibleForSale(currentListing)
  const buyDisabled = soldOut || currentListing.status === "draft" || isOwnListing || !saleEligible
  const listingRating = getListingRatingSummary(listing.id)
  const publicSeller = getPublicSellerProfile(listing.sellerId)
  const sellerCity = publicSeller?.city || listing.seller.location
  const shipFrom = hasSpecValue(listing.location) ? listing.location : sellerCity
  const sellerVerified = listing.seller.verified
  const description = listing.description.trim()
  const longDescription = description.length > 220
  const monthlySim = listing.priceValue > 0 ? formatIDR(Math.round(listing.priceValue / 24)) : ""

  const specRows: Array<{ label: string; value: string | number }> = []
  if (hasSpecValue(listing.year)) specRows.push({ label: t("listing.year"), value: listing.year })
  if (hasSpecValue(listing.mileage)) specRows.push({ label: t("listing.mileage"), value: listing.mileage })
  if (listing.condition) specRows.push({ label: t("listing.condition"), value: catalogValue(locale, listing.condition) })
  if (listing.brand) specRows.push({ label: t("listing.brand"), value: listing.brand })
  if (listing.model) specRows.push({ label: t("listing.model"), value: listing.model })
  if (hasSpecValue(listing.engine)) specRows.push({ label: t("listing.engine"), value: listing.engine })
  if (hasSpecValue(listing.transmission)) {
    specRows.push({ label: t("listing.transmission"), value: catalogValue(locale, listing.transmission) })
  }
  if (hasSpecValue(listing.fuel)) specRows.push({ label: t("listing.fuel"), value: catalogValue(locale, listing.fuel) })
  if (hasSpecValue(listing.color)) specRows.push({ label: t("listing.color"), value: listing.color })
  if (hasSpecValue(listing.location)) specRows.push({ label: t("listing.location"), value: listing.location })
  specRows.push({ label: t("listing.category"), value: categoryLabel(locale, listing.category) })

  function handleBuyNow() {
    if (buying || isPending(currentListing.id)) return
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/motorcycles/${currentListing.id}?buyNow=1`)}`)
      return
    }
    if (isOwnListing) {
      setChatNote(t("listing.cannotBuyOwn"))
      return
    }
    if (buyDisabled || !isListingEligibleForSale(currentListing)) return
    void addToCartThenGoToCart(currentListing)
  }

  const buyBusy = buying || isPending(currentListing.id)

  const actionClass =
    "min-w-0 flex-1 [&_button]:h-auto [&_button]:min-h-11 [&_button]:w-full [&_button]:whitespace-normal [&_button]:px-1.5 [&_button]:text-center [&_button]:leading-tight lg:[&_button]:px-3 [&_svg]:hidden lg:[&_svg]:inline"

  const actionButtons = (
    <div className="min-w-0">
      <div className="flex min-w-0 items-stretch gap-1.5 sm:gap-2">
      <WishlistActionButton
        listingId={currentListing.id}
        className={actionClass}
        label={t("listing.saveShort")}
        savedLabel={t("listing.wishlistSaved")}
      />
      <AddToCartButton
        listing={currentListing}
        variant="labeled"
        className={actionClass}
        labeledText={t("listing.addToCartAction")}
      />
      <Button
        className="min-h-11 min-w-0 flex-1 whitespace-normal px-1.5 py-2 text-center leading-tight lg:px-3"
        disabled={buyDisabled || buyBusy}
        onClick={handleBuyNow}
      >
        {buyBusy ? t("common.loading") : t("listing.buyNow")}
      </Button>
      </div>
      {buyError ? (
        <p className="mt-1.5 text-ui text-navy" role="alert">
          {buyError}
        </p>
      ) : null}
    </div>
  )

  const aboutSection = (
    <section className={`${surfaceCard("min-w-0 px-4 py-4")}`}>
      <h2 className="text-section font-semibold text-navy">{t("listing.aboutThis")}</h2>
      {description ? (
        <>
          <p className={`mt-2 whitespace-pre-wrap text-base leading-relaxed text-navy-muted ${!descOpen && longDescription ? "line-clamp-4" : ""}`}>
            {description}
          </p>
          {longDescription ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-ui font-medium text-brand hover:text-brand-hover"
              onClick={() => setDescOpen((open) => !open)}
              aria-expanded={descOpen}
            >
              {descOpen ? t("listing.showLess") : t("listing.showMore")}
              <ChevronDown className={`size-3.5 transition-transform ${descOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  )

  return (
    <main className="bg-white pb-28 lg:pb-16">
      <Container className="pt-4 sm:pt-5">
        <nav className="min-w-0 text-meta text-navy-muted" aria-label={t("listing.breadcrumb")}>
          <ol className="flex min-w-0 flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-brand">
                {t("common.home")}
              </Link>
            </li>
            {listing.brand ? (
              <>
                <li aria-hidden="true">/</li>
                <li className="min-w-0">
                  <Link to={browseBrandHref(listing.brand)} className="hover:text-brand">
                    {listing.brand}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={`/browse?category=${encodeURIComponent(listing.category)}`} className="hover:text-brand">
                    {categoryLabel(locale, listing.category)}
                  </Link>
                </li>
              </>
            )}
            {listing.model ? (
              <>
                <li aria-hidden="true">/</li>
                <li className="min-w-0">
                  <Link to={`/browse?q=${encodeURIComponent(listing.model)}`} className="hover:text-brand">
                    {listing.model}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li className="min-w-0 truncate text-navy">{listing.name}</li>
          </ol>
        </nav>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-start lg:gap-5">
          <div className="contents min-w-0 lg:flex lg:flex-col lg:gap-3">
            <div className={`${surfaceCard("order-1 min-w-0 p-3 lg:order-none")}`}>
              <ImageGallery images={gallery} alt={listing.name} />
            </div>
            <div className="order-3 min-w-0 lg:order-none">{aboutSection}</div>
          </div>

          <div className="order-2 min-w-0 space-y-3 lg:order-none">
            <section className={surfaceCard("min-w-0 px-4 py-4")}>
              <div className="flex min-w-0 items-start gap-2">
                <h1 className="min-w-0 flex-1 text-heading font-bold tracking-tight text-navy">{listing.name}</h1>
                <div className="flex shrink-0 items-center gap-1">
                  <FavoriteHeartButton
                    listingId={currentListing.id}
                    listingName={listing.name}
                    className="bg-transparent shadow-none hover:bg-surface"
                  />
                  <button
                    type="button"
                    onClick={() => void shareListing()}
                    aria-label={t("listing.share")}
                    className="rounded-full p-1.5 text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <Share2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {shareNote ? (
                <p className="mt-1 text-meta text-navy-muted" role="status">
                  {shareNote}
                </p>
              ) : null}

              {sellerVerified ? (
                <p className="mt-2 inline-flex items-center gap-1 text-meta font-medium text-brand">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {t("listing.verifiedSeller")}
                </p>
              ) : null}

              <div className="mt-2">
                <CompactRating
                  average={listingRating.average}
                  count={listingRating.count}
                  emptyLabel={t("listing.noReviews")}
                />
              </div>

              <p className="mt-3 text-3xl font-bold tracking-tight text-brand">{listing.price}</p>
              {soldOut ? (
                <p className="mt-1 text-ui font-medium text-navy">{t("listing.alreadySold")}</p>
              ) : (
                <p className="mt-1 text-meta text-navy-muted">{availableQuantityLabel(locale, available)}</p>
              )}

              <div className="mt-3">
                <SpecGrid rows={specRows} />
              </div>
            </section>

            <div className="space-y-2">
              <InfoRow
                icon={<Truck className="size-4" aria-hidden="true" />}
                title={t("listing.navShipping")}
                subtitle={
                  shipFrom
                    ? `${t("listing.shippedFrom", { location: shipFrom })}\n${t("listing.shippingConfirm")}`
                    : t("listing.shippingConfirm")
                }
              />
              <InfoRow
                icon={<CreditCard className="size-4" aria-hidden="true" />}
                title={t("listing.installment")}
                subtitle={t("listing.installmentSoon")}
                action={t("listing.viewSimulation")}
                onAction={() => setSimOpen((open) => !open)}
              />
              {simOpen ? (
                <div className="rounded-xl border border-line bg-white px-3 py-3">
                  <p className="text-ui font-semibold text-navy">{t("listing.installmentSimTitle")}</p>
                  {monthlySim ? (
                    <p className="mt-1 text-ui text-navy">{t("listing.installmentFrom", { amount: monthlySim })}</p>
                  ) : null}
                  <p className="mt-1 text-meta leading-relaxed text-navy-muted">{t("listing.installmentSimBody")}</p>
                </div>
              ) : null}
              <InfoRow
                icon={<ShieldCheck className="size-4" aria-hidden="true" />}
                title={t("listing.protection")}
                subtitle={t("listing.protectionSummary")}
                action={t("listing.learnMore")}
                onAction={() => setProtectOpen((open) => !open)}
              />
              {protectOpen ? (
                <div className="rounded-xl border border-line bg-white px-3 py-3">
                  <p className="text-meta leading-relaxed text-navy-muted">{t("listing.policiesIntro")}</p>
                  <ul className="mt-2 space-y-1 text-meta text-navy-muted">
                    <li>{t("listing.safetyOrderFlow")}</li>
                    <li>{t("listing.safetyChat")}</li>
                    <li>{t("listing.safety")}</li>
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="hidden lg:block">{actionButtons}</div>
            {isOwnListing ? (
              <p className="text-ui text-navy" role="status">
                {t("listing.cannotBuyOwn")}
              </p>
            ) : null}
            {chatNote ? (
              <p className="text-ui text-navy" role="status">
                {chatNote}
              </p>
            ) : null}

            <ul className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-white px-2 py-3">
              <li className="min-w-0 px-1 text-center">
                <ShieldCheck className="mx-auto size-4 text-brand" aria-hidden="true" />
                <p className="mt-1 text-meta font-semibold text-navy">{t("listing.benefitSafeTitle")}</p>
                <p className="text-meta text-navy-muted">{t("listing.benefitSafeBody")}</p>
              </li>
              <li className="min-w-0 px-1 text-center">
                <BadgeCheck className="mx-auto size-4 text-brand" aria-hidden="true" />
                <p className="mt-1 text-meta font-semibold text-navy">
                  {sellerVerified ? t("listing.benefitVerifiedTitle") : t("listing.seller")}
                </p>
                <p className="text-meta text-navy-muted">{t("listing.benefitVerifiedBody")}</p>
              </li>
              <li className="min-w-0 px-1 text-center">
                <Headphones className="mx-auto size-4 text-brand" aria-hidden="true" />
                <p className="mt-1 text-meta font-semibold text-navy">{t("listing.benefitCsTitle")}</p>
                <Link to="/#help" className="text-meta text-navy-muted hover:text-brand">
                  {t("listing.benefitCsBody")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <ListingSellerPanel
            listing={currentListing}
            onChat={() => void handleChatSeller(currentListing)}
            chatNote={chatNote}
          />
        </div>

        <div id="ulasan" className="mt-6 scroll-mt-24">
          <ListingReviewsSection listingId={listing.id} />
        </div>

        {related.length > 0 ? (
          <section className="mt-8 sm:mt-10">
            <h2 className="text-section font-semibold text-navy">{t("listing.similar")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 min-[769px]:gap-6 lg:grid-cols-4">
              {related.map((item) => (
                <MotorcycleCard key={item.id} listing={item} href={`/motorcycles/${item.id}`} showCategory />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div
        className="fixed inset-x-0 bottom-0 z-30 min-w-0 border-t border-line bg-white px-3 py-2.5 lg:hidden"
        style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
      >
        {actionButtons}
      </div>
    </main>
  )
}
