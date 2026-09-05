import { Calendar, Heart, MapPin, Tag } from "lucide-react"
import { useState, type MouseEvent } from "react"
import { Link } from "react-router-dom"
import type { MotorcycleListing } from "../../types/marketplace"

type Props = {
  listing: MotorcycleListing
  href?: string
  showCategory?: boolean
}

export function MotorcycleCard({ listing, href, showCategory = false }: Props) {
  const [saved, setSaved] = useState(false)

  function toggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setSaved((value) => !value)
  }

  const media = (
    <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-surface">
      <img
        src={listing.image}
        alt={listing.name}
        className="h-full w-full object-cover"
      />
    </div>
  )

  const body = (
    <div className="px-1 pb-3 pt-3">
      <h3 className="text-[15px] font-semibold leading-snug text-navy">
        {listing.name}
      </h3>
      <p className="mt-1 text-base font-semibold text-brand">{listing.price}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-navy-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" aria-hidden="true" />
          {listing.year}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden="true" />
          {listing.location}
        </span>
        {showCategory ? (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" aria-hidden="true" />
            {listing.category}
          </span>
        ) : null}
      </div>
    </div>
  )

  return (
    <article className="group relative min-w-[220px] overflow-hidden rounded-xl border border-transparent bg-white transition-all hover:-translate-y-0.5 hover:border-line sm:min-w-0">
      {href ? (
        <Link
          to={href}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {media}
          {body}
        </Link>
      ) : (
        <>
          {media}
          {body}
        </>
      )}
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.name} from favorites` : `Save ${listing.name} to favorites`}
        onClick={toggleFavorite}
        className="absolute right-3 top-3 z-10 rounded-full p-1 text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Heart
          className="size-5 drop-shadow-sm"
          fill={saved ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
      </button>
    </article>
  )
}
