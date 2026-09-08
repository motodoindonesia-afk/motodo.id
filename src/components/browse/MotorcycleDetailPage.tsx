import { Check, Headphones, MapPin, MessageCircle, Share2, ShieldCheck, Store } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { WishlistActionButton } from "../favorites/WishlistActionButton"
import { AddToCartButton } from "../cart/AddToCartButton"
import { getPublicListingById, getRelatedPublicListings } from "../../lib/listings"
import { isSupabaseConfigured } from "../../lib/supabase"
import { ensureRemoteListing } from "../../lib/listingsSupabase"
import { coerceListingQuantity } from "../../lib/listingForm"
import { availableQuantityLabel, catalogValue, categoryLabel, useLanguage } from "../../i18n"
import { startBuyerConversation } from "../../lib/chat"
import { useListingsLive } from "../../lib/useListingsLive"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import { MotorcycleCard } from "../ui/MotorcycleCard"
import { Container } from "../layout/Container"
import { ImageGallery } from "./ImageGallery"
import { ListingReviewsSection } from "../reviews/ListingReviewsSection"
import { CompactRating } from "../reviews/CompactRating"
import { getListingRatingSummary, getSellerRatingSummary } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { getPublicSellerProfile, getSellerActiveListings, publicSellerPath } from "../../lib/sellers"
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
        <div key={row.label} className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:border-r sm:odd:border-r sm:even:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
          <dt className="text-sm text-navy-muted">{row.label}</dt>
          <dd className="text-sm font-medium text-navy">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function MotorcycleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { locale, t } = useLanguage()
  useListingsLive()
  useReviewsLive()
  const listing = id ? getPublicListingById(id) : undefined
  const [shareNote, setShareNote] = useState("")
  const [chatNote, setChatNote] = useState("")
  const [lookingUp, setLookingUp] = useState(false)

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
  }, [id])

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
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("listing.notFound")}</h1>
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
  const buyDisabled = soldOut || currentListing.status === "draft" || isOwnListing
  const listingRating = getListingRatingSummary(listing.id)
  const sellerRating = getSellerRatingSummary(listing.sellerId)
  const publicSeller = getPublicSellerProfile(listing.sellerId)
  const activeListings = getSellerActiveListings(listing.sellerId).length
  const showroom = publicSeller?.showroomAddress
  const sellerCity = publicSeller?.city || listing.seller.location

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
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/checkout/${currentListing.id}`)}`)
      return
    }
    if (isOwnListing) {
      setChatNote(t("listing.cannotBuyOwn"))
      return
    }
    if (buyDisabled) return
    navigate(`/checkout/${currentListing.id}`)
  }

  const ctaPair = (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 gap-3">
        <AddToCartButton listing={currentListing} variant="labeled" className="min-w-0 flex-1" />
        <Button className="min-w-0 flex-1 px-5 py-3" disabled={buyDisabled} onClick={handleBuyNow}>
          {t("listing.buyNow")}
        </Button>
      </div>
      <WishlistActionButton listingId={currentListing.id} />
    </div>
  )

  return (
    <main className="bg-white pb-28 lg:pb-20">
      <Container className="pt-6 sm:pt-8">
        <nav className="text-sm text-navy-muted" aria-label={t("listing.breadcrumb")}>
          <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
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

        <div className="mt-6 grid min-w-0 gap-5 rounded-2xl border border-line bg-white p-4 shadow-card lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:items-start lg:gap-8 lg:p-5">
          <ImageGallery images={gallery} alt={listing.name} />

          <div className="min-w-0">
            {soldOut ? (
              <p className="text-xs font-semibold tracking-wide text-navy uppercase">{t("listing.soldOut")}</p>
            ) : null}
            <h1 className="text-[1.375rem] font-bold tracking-tight text-navy sm:text-2xl">{listing.name}</h1>

            {listing.seller.verified ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {t("listing.verifiedSeller")}
              </p>
            ) : null}

            <div className="mt-3">
              <CompactRating
                average={listingRating.average}
                count={listingRating.count}
                emptyLabel={t("listing.noReviews")}
              />
            </div>

            <p className="mt-4 text-[1.75rem] font-bold tracking-tight text-brand sm:text-[1.875rem]">{listing.price}</p>
            {soldOut ? (
              <p className="mt-2 text-sm font-medium text-navy">{t("listing.alreadySold")}</p>
            ) : (
              <p className="mt-2 text-sm text-navy-muted">{availableQuantityLabel(locale, available)}</p>
            )}

            <div className="mt-5">
              <SpecGrid rows={specRows} />
            </div>

            <div className="mt-6 hidden lg:block">{ctaPair}</div>

            {isOwnListing ? (
              <p className="mt-2 text-sm text-navy" role="status">
                {t("listing.cannotBuyOwn")}
              </p>
            ) : null}
            {chatNote ? (
              <p className="mt-2 text-sm text-navy" role="status">
                {chatNote}
              </p>
            ) : null}

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-navy-muted">
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" aria-hidden="true" />
                {t("listing.trustChat")}
              </li>
              {listing.seller.verified ? (
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand" aria-hidden="true" />
                  {t("listing.verifiedSeller")}
                </li>
              ) : null}
              <li className="inline-flex items-center gap-1.5">
                <Headphones className="size-3.5 text-brand" aria-hidden="true" />
                <Link to="/#help" className="hover:text-brand">
                  {t("listing.trustSupport")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-line bg-white px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Store className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-navy-muted uppercase">{t("listing.seller")}</p>
                <Link
                  to={publicSellerPath(listing.sellerId)}
                  className="mt-0.5 inline-block text-lg font-semibold text-navy hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {listing.seller.name}
                </Link>
                {listing.seller.verified ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-navy">
                    <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                    {t("listing.verifiedSeller")}
                  </p>
                ) : null}
                <div className="mt-2">
                  <CompactRating
                    average={sellerRating.average}
                    count={sellerRating.count}
                    emptyLabel={t("listing.noSellerReviews")}
                  />
                </div>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-muted">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {sellerCity}
                </p>
                {listing.seller.memberSince ? (
                  <p className="mt-1 text-sm text-navy-muted">
                    {t("listing.memberSince")} {listing.seller.memberSince}
                  </p>
                ) : null}
                {activeListings > 0 ? (
                  <p className="mt-1 text-sm text-navy-muted">
                    {activeListings === 1 ? t("listing.activeCountOne") : t("listing.activeCount", { count: activeListings })}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                to={publicSellerPath(listing.sellerId)}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {t("listing.viewShop")}
              </Link>
              <Button className="flex-1" onClick={() => void handleChatSeller(currentListing)}>
                <MessageCircle className="size-4" aria-hidden="true" />
                {t("listing.chatSeller")}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-brand/20 bg-brand-soft/40 px-5 py-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
              {t("listing.buyOnMotodo")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-navy-muted">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t("listing.safetySellerVisible")}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t("listing.safetyOrderFlow")}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t("listing.safetyChat")}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {t("listing.safety")}
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white px-4 py-5 shadow-card sm:px-6 sm:py-6">
        <nav className="overflow-x-auto border-b border-line" aria-label={t("listing.sectionNav")}>
          <ul className="flex min-w-max gap-5 text-sm">
            {[
              { href: "#detail-motor", label: t("listing.navDetails") },
              { href: "#deskripsi", label: t("listing.description") },
              { href: "#ulasan", label: t("review.reviews") },
              { href: "#pengiriman", label: t("listing.navShipping") },
              { href: "#kebijakan", label: t("listing.navPolicies") },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex border-b-2 border-transparent py-3 font-medium text-navy-muted hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id="detail-motor" className="mt-8 scroll-mt-24">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("listing.navDetails")}</h2>
          <div className="mt-5">
            <SpecGrid rows={specRows} />
          </div>
        </section>

        <section id="deskripsi" className="mt-12 scroll-mt-24 sm:mt-14">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("listing.description")}</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-navy-muted">
            {listing.description}
          </p>
        </section>

        <div id="ulasan" className="scroll-mt-24">
          <ListingReviewsSection listingId={listing.id} />
        </div>

        <section id="pengiriman" className="mt-12 scroll-mt-24 sm:mt-14">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("listing.navShipping")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-muted">{t("listing.shippingNote")}</p>
          <dl className="mt-5 max-w-xl space-y-2 text-sm">
            {hasSpecValue(listing.location) ? (
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">{t("listing.location")}</dt>
                <dd className="font-medium text-navy">{listing.location}</dd>
              </div>
            ) : null}
            {sellerCity ? (
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">{t("listing.sellerCity")}</dt>
                <dd className="font-medium text-navy">{sellerCity}</dd>
              </div>
            ) : null}
            {showroom ? (
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">{t("listing.showroom")}</dt>
                <dd className="max-w-[60%] text-right font-medium text-navy">{showroom}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-6">
            <p className="text-sm font-medium text-navy">{t("listing.share")}</p>
            <Button variant="secondary" className="mt-2" onClick={() => void shareListing()}>
              <Share2 className="size-4" aria-hidden="true" />
              {t("listing.copyLink")}
            </Button>
            {shareNote ? (
              <p className="mt-2 text-xs text-navy-muted" role="status">
                {shareNote}
              </p>
            ) : null}
          </div>
        </section>

        <section id="kebijakan" className="mt-12 scroll-mt-24 sm:mt-14">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("listing.navPolicies")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-muted">{t("listing.policiesIntro")}</p>
          <ul className="mt-4 max-w-2xl space-y-2 text-sm text-navy-muted">
            <li>{t("listing.safetyOrderFlow")}</li>
            <li>{t("listing.safetyChat")}</li>
            <li>{t("listing.safety")}</li>
          </ul>
          <p className="mt-4 text-sm">
            <Link to="/#help" className="font-medium text-brand hover:text-brand-hover">
              {t("listing.trustSupport")}
            </Link>
          </p>
        </section>
        </div>

        {related.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <h2 className="text-xl font-bold text-navy sm:text-2xl">{t("listing.similar")}</h2>
            <div className="mt-6 grid grid-cols-2 gap-2.5 min-[769px]:gap-6 lg:grid-cols-4">
              {related.map((item) => (
                <MotorcycleCard key={item.id} listing={item} href={`/motorcycles/${item.id}`} showCategory />
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {ctaPair}
      </div>
    </main>
  )
}
