import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import type { MotorcycleListing } from "../../types/marketplace"
import { coerceListingQuantity } from "../../lib/listingForm"
import { cn } from "../../lib/cn"
import { availableQuantityLabel, categoryLabel, useLanguage } from "../../i18n"
import { FavoriteHeartButton } from "../favorites/FavoriteHeartButton"
import { AddToCartButton } from "../cart/AddToCartButton"

type Props = {
  listing: MotorcycleListing
  href?: string
  showCategory?: boolean
  badge?: ReactNode
  footer?: ReactNode
  hideQuantity?: boolean
  unavailable?: boolean
}

function cardMeta(listing: MotorcycleListing, showCategory: boolean, locale: "id" | "en") {
  const parts = [listing.location, listing.year ? String(listing.year) : "", listing.mileage]
  if (showCategory) parts.push(categoryLabel(locale, listing.category))
  return parts.filter((part) => part && part !== "—").join(" · ")
}

export function MotorcycleCard({
  listing,
  href,
  showCategory = false,
  badge,
  footer,
  hideQuantity = false,
  unavailable = false,
}: Props) {
  const { locale, t } = useLanguage()

  const meta = cardMeta(listing, showCategory, locale)
  const units = coerceListingQuantity(listing.quantity)
  const quantityLabel =
    hideQuantity || listing.status === "sold" || unavailable ? null : availableQuantityLabel(locale, units)

  const media = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface">
      {listing.image ? (
        <img
          src={listing.image}
          alt={listing.name}
          className={cn("absolute inset-0 h-full w-full object-cover", unavailable && "opacity-60")}
        />
      ) : null}
      {unavailable ? (
        <span className="absolute bottom-2 left-2 z-10 rounded-md bg-navy/80 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
          {t("wishlist.unavailable")}
        </span>
      ) : null}
      {badge ? <div className="absolute left-2 top-2 z-10">{badge}</div> : null}
    </div>
  )

  const body = (
    <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2 sm:px-3">
      <h3 className="h-[calc(1.35em*2)] overflow-hidden text-[14px] font-semibold leading-[1.35] text-navy [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
        {listing.name}
      </h3>
      <p className="mt-0.5 shrink-0 text-[16px] font-bold leading-[1.25] text-brand min-[769px]:text-[18px]">{listing.price}</p>
      {hideQuantity ? null : (
        <p className="mt-0.5 min-h-[1.4em] shrink-0 truncate text-[11px] leading-[1.4] text-navy-muted min-[769px]:text-[12px]">{quantityLabel ?? "\u00a0"}</p>
      )}
      <p className="mt-1 min-h-[1.4em] shrink-0 truncate text-[11px] leading-[1.4] text-navy-muted min-[769px]:text-[12px]">{meta || "\u00a0"}</p>
      {footer ? <div className="mt-1.5 shrink-0">{footer}</div> : null}
    </div>
  )

  const inner = (
    <>
      {media}
      {body}
    </>
  )

  return (
    <article className="group relative flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-colors hover:border-brand/25 max-[769px]:rounded-xl">
      {href ? (
        <Link
          to={href}
          aria-label={t("listing.view", { name: listing.name })}
          className="flex h-full min-h-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
      <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
        <FavoriteHeartButton listingId={listing.id} listingName={listing.name} />
        {unavailable ? null : <AddToCartButton listing={listing} />}
      </div>
    </article>
  )
}
