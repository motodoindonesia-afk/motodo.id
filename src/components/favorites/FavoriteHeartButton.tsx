import { Heart } from "lucide-react"
import { useState, type MouseEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useFavorites } from "../../context/FavoritesContext"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = {
  listingId: string
  listingName: string
  className?: string
}

export function FavoriteHeartButton({ listingId, listingName, className }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { isFavorited, isPending, toggleListingFavorite } = useFavorites()
  const [error, setError] = useState("")
  const favorited = isFavorited(listingId)
  const pending = isPending(listingId)

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setError("")
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search}`
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (pending) return
    try {
      await toggleListingFavorite(listingId)
    } catch {
      setError(t("wishlist.toggleError"))
    }
  }

  return (
    <button
      type="button"
      aria-pressed={favorited}
      aria-busy={pending}
      aria-label={favorited ? t("listing.unsave", { name: listingName }) : t("listing.save", { name: listingName })}
      title={error || undefined}
      disabled={pending}
      onClick={(event) => void handleClick(event)}
      className={cn(
        "rounded-full bg-white/85 p-1 text-navy shadow-sm transition-opacity hover:opacity-80",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        favorited && "text-brand",
        pending && "opacity-60",
        className,
      )}
    >
      <Heart className="size-4" fill={favorited ? "currentColor" : "none"} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
