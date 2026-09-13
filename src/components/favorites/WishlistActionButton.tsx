import { Heart } from "lucide-react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useFavorites } from "../../context/FavoritesContext"
import { Button } from "../ui/Button"
import { useT } from "../../i18n"

type Props = {
  listingId: string
  className?: string
  label?: string
  savedLabel?: string
}

export function WishlistActionButton({ listingId, className, label, savedLabel }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { isFavorited, isPending, toggleListingFavorite } = useFavorites()
  const [error, setError] = useState("")
  const favorited = isFavorited(listingId)
  const pending = isPending(listingId)

  async function handleClick() {
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
    <div className={className}>
      <Button
        variant="secondary"
        className="w-full border-brand px-5 py-3 text-brand hover:bg-brand-soft"
        aria-pressed={favorited}
        aria-busy={pending}
        disabled={pending}
        onClick={() => void handleClick()}
      >
        <Heart className="size-4" fill={favorited ? "currentColor" : "none"} strokeWidth={1.75} aria-hidden="true" />
        {favorited ? (savedLabel ?? t("listing.wishlistSaved")) : (label ?? t("listing.wishlist"))}
      </Button>
      {error ? (
        <p className="mt-1 text-xs text-navy" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}
