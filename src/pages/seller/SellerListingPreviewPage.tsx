import { useNavigate, useParams } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getAvailableStock } from "../../lib/inventory"
import { emptyListingForm, formatIDR, validateListingForm } from "../../lib/listingForm"
import { canManageListing, getListingById, publishListing, toCatalogListing } from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import { useListingsLive } from "../../lib/useListingsLive"
import { ImageGallery } from "../../components/browse/ImageGallery"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
import { Button } from "../../components/ui/Button"
import { availableQuantityLabel, catalogValue, categoryLabel, useLanguage } from "../../i18n"

export function SellerListingPreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useListingsLive()
  const { locale, t } = useLanguage()

  if (!user) return null
  const listing = id ? getListingById(id) : null
  if (!listing) {
    return <SellerListingAccessMessage title={t("seller.notFoundListing")} onBack={() => navigate("/seller/listings")} />
  }

  if (!canManageListing(listing, user.id)) {
    return (
      <SellerListingAccessMessage
        title={t("seller.noListingAccess")}
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
    [t("listing.year"), String(catalog.year || "—")],
    [t("listing.mileage"), catalog.mileage],
    [t("listing.engine"), catalog.engine],
    [t("listing.transmission"), catalogValue(locale, catalog.transmission)],
    [t("listing.fuel"), catalogValue(locale, catalog.fuel)],
    [t("listing.color"), catalog.color],
    [t("listing.category"), categoryLabel(locale, catalog.category)],
    [t("listing.location"), catalog.location],
    [t("listing.condition"), catalog.condition ? catalogValue(locale, catalog.condition) : "—"],
    [t("listing.brand"), catalog.brand ?? "—"],
    [t("listing.model"), catalog.model ?? "—"],
    [t("checkout.quantity"), String(getAvailableStock(listing))],
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
    <div className="min-w-0">
        <div className="rounded-2xl border border-line bg-white px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-navy">{t("seller.previewTitle")}</p>
          <p className="mt-1 text-sm text-navy-muted">{t("seller.previewBody")}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
              {t("seller.backEdit")}
            </Button>
            <Button onClick={() => void handlePublish()}>{t("seller.publish")}</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          {gallery.length > 0 ? (
            <ImageGallery images={gallery} alt={catalog.name} />
          ) : (
            <div className="flex aspect-[16/11] items-center justify-center rounded-2xl bg-surface text-sm text-navy-muted">
              {t("seller.noPhotos")}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy">{catalog.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand">{formatIDR(listing.price)}</p>
            <p className="mt-2 text-sm text-navy-muted">{availableQuantityLabel(locale, getAvailableStock(listing))}</p>
            <p className="mt-3 text-sm text-navy-muted">
              {catalog.year} · {catalog.mileage} · {catalog.location} · {categoryLabel(locale, catalog.category)}
            </p>
            <div className="mt-8 rounded-2xl border border-line px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">{t("listing.seller")}</p>
              <p className="mt-1 text-base font-semibold text-navy">{catalog.seller.name}</p>
              {catalog.seller.verified ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy">
                  <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
                  {t("listing.verifiedSeller")}
                </p>
              ) : null}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">{t("listing.location")}</dt>
                  <dd className="font-medium text-navy">{catalog.seller.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-navy-muted">{t("listing.memberSince")}</dt>
                  <dd className="font-medium text-navy">{catalog.seller.memberSince}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy">{t("seller.specs")}</h2>
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
          <h2 className="text-xl font-bold text-navy">{t("listing.description")}</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-navy-muted">{catalog.description}</p>
        </section>
    </div>
  )
}
