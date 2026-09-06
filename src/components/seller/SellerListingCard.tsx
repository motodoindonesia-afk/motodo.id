import { useNavigate } from "react-router-dom"
import type { MotorcycleListing } from "../../types/sellerListing"
import { formatIDR } from "../../lib/listingForm"
import { useT } from "../../i18n"
import { listingStockSummary } from "../../lib/inventory"
import { formatShortDate } from "../../lib/profile"
import { Button } from "../ui/Button"
import { cn } from "../../lib/cn"

type Props = {
  listing: MotorcycleListing
  onDelete: (listing: MotorcycleListing) => void
  onMarkSold?: (listing: MotorcycleListing) => void
  onMarkActive?: (listing: MotorcycleListing) => void
}

export function SellerListingCard({ listing, onDelete, onMarkSold, onMarkActive }: Props) {
  const navigate = useNavigate()
  const t = useT()
  const statusLabel =
    listing.status === "active" ? t("seller.statusActive") : listing.status === "sold" ? t("seller.statusSold") : t("seller.statusDraft")
  const cover = listing.images[0]
  const place = [listing.location, listing.city].filter(Boolean).join(", ")
  const stock = listingStockSummary(listing)

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
      <div className="h-36 w-full overflow-hidden rounded-xl bg-surface sm:h-24 sm:w-36 sm:shrink-0">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-navy-muted">{t("chat.noPhoto")}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-navy">{listing.name || t("seller.untitled")}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              listing.status === "active" && "bg-surface text-brand",
              listing.status === "draft" && "bg-surface text-navy-muted",
              listing.status === "sold" && "bg-surface text-navy",
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-brand">{formatIDR(listing.price)}</p>
        <p className="mt-1 text-xs text-navy-muted">
          {stock.available <= 0 ? t("listing.soldOut") : t("seller.availableCount", { count: stock.available })}
          {stock.reserved > 0 ? ` · ${t("seller.reserved", { count: stock.reserved })}` : ""}
          {` · ${t("seller.stockCount", { count: stock.total })}`}
        </p>
        <p className="mt-1 text-xs text-navy-muted">
          {listing.year || "—"}
          {place ? ` · ${place}` : ""} · {formatShortDate(listing.createdAt)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}`)}>
          {t("seller.view")}
        </Button>
        {listing.status === "draft" ? (
          <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
            {t("seller.continueEditing")}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => navigate(`/seller/listings/${listing.id}/edit`)}>
          {t("common.edit")}
        </Button>
        {listing.status === "active" && onMarkSold ? (
          <Button variant="secondary" onClick={() => onMarkSold(listing)}>
            {t("seller.markSold")}
          </Button>
        ) : null}
        {listing.status === "sold" && stock.available >= 1 && onMarkActive ? (
          <Button variant="secondary" onClick={() => onMarkActive(listing)}>
            {t("seller.markActive")}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          className="border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => onDelete(listing)}
        >
          {t("common.delete")}
        </Button>
      </div>
    </article>
  )
}
