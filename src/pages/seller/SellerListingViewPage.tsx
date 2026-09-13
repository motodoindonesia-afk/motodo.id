import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { formatIDR } from "../../lib/listingForm"
import { listingStockSummary } from "../../lib/inventory"
import {
  canManageListing,
  deleteListing,
  getListingById,
  markListingAsActive,
  markListingAsSold,
  toCatalogListing,
} from "../../lib/listings"
import { getSellerProfile } from "../../lib/seller"
import { useListingsLive } from "../../lib/useListingsLive"
import { ConfirmListingModal } from "../../components/seller/ConfirmListingModal"
import { DeleteListingModal } from "../../components/seller/DeleteListingModal"
import { SellerListingAccessMessage } from "../../components/seller/SellerListingAccessMessage"
import { ImageGallery } from "../../components/browse/ImageGallery"
import { Button } from "../../components/ui/Button"
import { availableQuantityLabel, catalogValue, categoryLabel, useLanguage } from "../../i18n"

export function SellerListingViewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useListingsLive()
  const { locale, t } = useLanguage()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [soldOpen, setSoldOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(false)

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

  const profile = getSellerProfile(user.id)
  const catalog = toCatalogListing(listing, profile)
  const stock = listingStockSummary(listing)
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
    [t("seller.showroomAddress"), listing.showroomAddress || "—"],
    [t("listing.condition"), catalog.condition ? catalogValue(locale, catalog.condition) : "—"],
    [t("listing.brand"), catalog.brand ?? "—"],
    [t("listing.model"), catalog.model ?? "—"],
    [t("orders.status"), listing.status === "active" ? t("seller.statusActive") : listing.status === "sold" ? t("seller.statusSold") : t("seller.statusDraft")],
    [t("listing.stock"), String(stock.total)],
    [t("seller.reservedShort"), String(stock.reserved)],
    [t("seller.availableShort"), String(stock.available)],
  ]

  return (
    <div className="min-w-0">
        <div className="rounded-2xl border border-line bg-white px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-navy">{t("seller.sellerView")}</p>
          <p className="mt-1 text-sm text-navy-muted">{t("seller.sellerViewBody")}</p>
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
            <p className="text-xs font-medium uppercase tracking-wide text-navy-muted">
              {listing.status === "active" ? t("seller.statusActive") : listing.status === "sold" ? t("seller.statusSold") : t("seller.statusDraft")}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy">{catalog.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand">{formatIDR(listing.price)}</p>
            <p className="mt-2 text-sm text-navy-muted">{availableQuantityLabel(locale, stock.available)}</p>
            <p className="mt-3 text-sm text-navy-muted">
              {catalog.year} · {catalog.mileage} · {catalog.location} · {categoryLabel(locale, catalog.category)}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>{t("seller.editListing")}</Button>
              {listing.status === "active" ? (
                <Button variant="secondary" onClick={() => setSoldOpen(true)}>
                  {t("seller.markSold")}
                </Button>
              ) : null}
              {listing.status === "sold" && stock.available >= 1 ? (
                <Button variant="secondary" onClick={() => setActiveOpen(true)}>
                  {t("seller.markActive")}
                </Button>
              ) : null}
              {listing.status === "sold" && stock.available < 1 ? (
                <p className="text-sm text-navy-muted">{t("seller.increaseQty")}</p>
              ) : null}
              <Button
                variant="secondary"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                {t("seller.deleteListing")}
              </Button>
              <Button variant="secondary" onClick={() => navigate("/seller/listings")}>
                {t("seller.backListings")}
              </Button>
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

      {deleteOpen ? (
        <DeleteListingModal
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            await deleteListing(listing.id, user.id)
            navigate("/seller/listings")
          }}
        />
      ) : null}
      {soldOpen ? (
        <ConfirmListingModal
          title={t("seller.markSold")}
          message={t("seller.markSoldQ")}
          confirmLabel={t("seller.markSold")}
          onCancel={() => setSoldOpen(false)}
          onConfirm={async () => {
            await markListingAsSold(listing.id, user.id)
            setSoldOpen(false)
          }}
        />
      ) : null}
      {activeOpen ? (
        <ConfirmListingModal
          title={t("seller.markActive")}
          message={t("seller.markActiveQ")}
          confirmLabel={t("seller.markActive")}
          onCancel={() => setActiveOpen(false)}
          onConfirm={async () => {
            await markListingAsActive(listing.id, user.id)
            setActiveOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
