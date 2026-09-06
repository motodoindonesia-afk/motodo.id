import { Heart } from "lucide-react"
import { useState, type MouseEvent, type ReactNode } from "react"
import { Link } from "react-router-dom"
import type { MotorcycleListing } from "../../types/marketplace"
import { formatAvailableQuantity } from "../../lib/listingForm"
import { cn } from "../../lib/cn"

type Props = {
  listing: MotorcycleListing
  href?: string
  showCategory?: boolean
  badge?: ReactNode
  footer?: ReactNode
  hideQuantity?: boolean
}

function cardMeta(listing: MotorcycleListing, showCategory: boolean) {
  const parts = [listing.location, listing.year ? String(listing.year) : "", listing.mileage]
  if (showCategory) parts.push(listing.category)
  return parts.filter((part) => part && part !== "—").join(" · ")
}

export function MotorcycleCard({
  listing,
  href,
  showCategory = false,
  badge,
  footer,
  hideQuantity = false,
}: Props) {
  const [saved, setSaved] = useState(false)

  function toggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setSaved((value) => !value)
  }

  const meta = cardMeta(listing, showCategory)
  const quantityLabel =
    hideQuantity || listing.status === "sold" ? null : formatAvailableQuantity(listing.quantity)

  const media = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface">
      <img
        src={listing.image}
        alt={listing.name}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {badge ? <div className="absolute left-2 top-2 z-10">{badge}</div> : null}
    </div>
  )

  const body = (
    <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2 sm:px-3">
      <h3 className="h-[calc(1.35em*2)] overflow-hidden text-card-title font-semibold leading-[1.35] text-navy [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
        {listing.name}
      </h3>
      <p className="mt-0.5 shrink-0 text-price font-bold leading-[1.25] text-brand">{listing.price}</p>
      {hideQuantity ? null : (
        <p className="mt-0.5 min-h-[1.4em] shrink-0 truncate text-meta text-navy-muted">{quantityLabel ?? "\u00a0"}</p>
      )}
      <p className="mt-1 min-h-[1.4em] shrink-0 truncate text-meta text-navy-muted">{meta || "\u00a0"}</p>
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
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-navy/20">
      {href ? (
        <Link
          to={href}
          aria-label={`View ${listing.name}`}
          className="flex h-full min-h-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
        onClick={toggleFavorite}
        className={cn(
          "absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1 text-navy transition-opacity hover:opacity-80",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        )}
      >
        <Heart
          className="size-4"
          fill={saved ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
      </button>
    </article>
  )
}
