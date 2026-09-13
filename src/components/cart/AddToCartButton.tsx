import { Check, ShoppingCart } from "lucide-react"
import { useState, type MouseEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { isListingEligibleForCart } from "../../lib/platform/commerce"
import { userFacingMessage } from "../../lib/userFacingError"
import { cn } from "../../lib/cn"
import { Button } from "../ui/Button"
import { useT } from "../../i18n"

type ListingHint = {
  id: string
  name?: string
  isDemo?: boolean
  status?: string
  sellerId?: string
}

type Props = {
  listing: ListingHint
  variant?: "icon" | "labeled"
  className?: string
  labeledText?: string
}

export function AddToCartButton({ listing, variant = "icon", className, labeledText }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { addListingToCart, hasListing, isPending } = useCart()
  const [error, setError] = useState("")
  const [justAdded, setJustAdded] = useState(false)
  const pending = isPending(listing.id)
  const inCart = hasListing(listing.id)
  const eligible = isListingEligibleForCart(listing, user?.id)

  async function runAdd() {
    setError("")
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search}`
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (pending || !eligible) return
    try {
      await addListingToCart(listing.id)
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1600)
    } catch (caught) {
      setError(userFacingMessage(caught, t("cart.addError")))
    }
  }

  function handleIconClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    void runAdd()
  }

  if (!eligible) return null

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={inCart || justAdded ? t("cart.inCart") : t("cart.add", { name: listing.name ?? "" })}
        aria-busy={pending}
        title={error || undefined}
        disabled={pending}
        onClick={handleIconClick}
        className={cn(
          "rounded-full bg-white/85 p-1 text-navy shadow-sm transition-opacity hover:opacity-80",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          (inCart || justAdded) && "text-brand",
          pending && "opacity-60",
          className,
        )}
      >
        {justAdded ? (
          <Check className="size-4" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <ShoppingCart className="size-4" strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="secondary"
        className="w-full border-brand px-5 py-3 text-brand hover:bg-brand-soft"
        aria-busy={pending}
        disabled={pending}
        onClick={() => void runAdd()}
      >
        {justAdded ? (
          <Check className="size-4" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <ShoppingCart className="size-4" strokeWidth={1.75} aria-hidden="true" />
        )}
        {justAdded || inCart ? t("cart.inCart") : labeledText ?? t("cart.addShort")}
      </Button>
      {error ? (
        <p className="mt-1 text-xs text-navy" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}
