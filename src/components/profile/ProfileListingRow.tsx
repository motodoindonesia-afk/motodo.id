import { Link } from "react-router-dom"
import type { ListingStatus } from "../../types/marketplace"
import type { SellerOwnedListing } from "../../lib/sellerListings"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

const actionClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"

export function ProfileListingRow({ listing }: { listing: SellerOwnedListing }) {
  const t = useT()
  const status = listing.status
  const statusLabel: Record<ListingStatus, string> = {
    active: t("seller.statusActive"),
    draft: t("seller.statusDraft"),
    sold: t("seller.statusSold"),
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center">
      <img
        src={listing.image}
        alt=""
        className="h-28 w-full rounded-lg object-cover sm:h-20 sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-navy">{listing.name}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              status === "active" && "bg-surface text-brand",
              status === "draft" && "bg-surface text-navy-muted",
              status === "sold" && "bg-surface text-navy",
            )}
          >
            {statusLabel[status]}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-brand">{listing.price}</p>
        <p className="mt-0.5 text-xs text-navy-muted">{listing.year}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/motorcycles/${listing.id}`}
          className={cn(actionClass, "border border-line bg-white text-navy hover:bg-surface")}
        >
          {t("seller.view")}
        </Link>
        <Link to="/sell" className={cn(actionClass, "bg-brand text-white hover:bg-brand-hover")}>
          {t("common.edit")}
        </Link>
      </div>
    </article>
  )
}
