import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { useCart } from "../context/CartContext"
import { ensureRemoteListing, getListingById, toCatalogListing } from "../lib/listings"
import { formatIDR } from "../lib/listingForm"
import { isCartLinePurchasable } from "../lib/platform/commerce"
import { isSupabaseConfigured } from "../lib/supabase"
import { userFacingMessage } from "../lib/userFacingError"
import { useListingsLive } from "../lib/useListingsLive"
import { cn } from "../lib/cn"
import type { CartItem } from "../types/cart"
import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import { useT } from "../i18n"

function catalogFor(listingId: string): CatalogListing | null {
  const stored = getListingById(listingId)
  return stored ? toCatalogListing(stored) : null
}

function lineTotal(item: CartItem, listing: CatalogListing | null) {
  if (!listing) return 0
  return Math.round(listing.priceValue) * item.quantity
}

export function CartPage() {
  const t = useT()
  const navigate = useNavigate()
  const listingVersion = useListingsLive()
  const { items, loading, isPending, removeListingFromCart, setListingQuantity } = useCart()
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const ids = useMemo(() => items.map((item) => item.listingId), [items])

  useEffect(() => {
    if (!isSupabaseConfigured() || ids.length === 0) {
      setResolving(false)
      return
    }
    let cancelled = false
    setResolving(true)
    void Promise.all(ids.map((id) => ensureRemoteListing(id))).finally(() => {
      if (!cancelled) setResolving(false)
    })
    return () => {
      cancelled = true
    }
  }, [ids, listingVersion])

  useEffect(() => {
    const availableIds = new Set(
      items.filter((item) => isCartLinePurchasable(item)).map((item) => item.listingId),
    )
    setSelected((current) => {
      const next = new Set([...current].filter((id) => availableIds.has(id)))
      if (next.size === 0 && availableIds.size === 1) {
        const [only] = availableIds
        next.add(only)
      }
      return next
    })
  }, [items])

  const rows = useMemo(
    () =>
      items.map((item) => ({
        item,
        listing: catalogFor(item.listingId),
        purchasable: isCartLinePurchasable(item),
      })),
    [items, listingVersion, resolving],
  )

  const selectedRows = rows.filter((row) => selected.has(row.item.listingId) && row.purchasable)
  const subtotal = selectedRows.reduce((sum, row) => sum + lineTotal(row.item, row.listing), 0)

  function toggleSelected(listingId: string, purchasable: boolean) {
    if (!purchasable) return
    setMessage("")
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(listingId)) next.delete(listingId)
      else next.add(listingId)
      return next
    })
  }

  async function handleRemove(listingId: string) {
    setError("")
    try {
      await removeListingFromCart(listingId)
    } catch (caught) {
      setError(userFacingMessage(caught, t("cart.updateError")))
    }
  }

  async function handleQuantity(listingId: string, nextQty: number, max: number) {
    setError("")
    if (nextQty < 1 || nextQty > max) return
    try {
      await setListingQuantity(listingId, nextQty)
    } catch (caught) {
      setError(userFacingMessage(caught, t("cart.updateError")))
    }
  }

  function handleCheckout() {
    setMessage("")
    if (selectedRows.length === 0) {
      setMessage(t("cart.selectOne"))
      return
    }
    if (selectedRows.length > 1) {
      setMessage(t("cart.singleCheckoutOnly"))
      return
    }
    const chosen = selectedRows[0]
    if (!chosen.purchasable) {
      setMessage(t("cart.unavailable"))
      return
    }
    navigate(`/checkout/${chosen.item.listingId}`)
  }

  const summary = (
    <aside className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="text-base font-bold text-navy">{t("cart.summary")}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-navy-muted">{t("cart.subtotal")}</dt>
          <dd className="font-medium text-navy">{formatIDR(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-navy-muted">{t("cart.fees")}</dt>
          <dd className="text-right text-navy-muted">{t("cart.feesAtCheckout")}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-line pt-2">
          <dt className="font-semibold text-navy">{t("cart.total")}</dt>
          <dd className="text-price font-bold text-brand">{formatIDR(subtotal)}</dd>
        </div>
      </dl>
      {message ? (
        <p className="mt-3 text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-4 w-full py-3" onClick={handleCheckout}>
        {t("cart.checkout")}
      </Button>
    </aside>
  )

  return (
    <div className="min-w-0">
        <h1 className="text-heading font-semibold tracking-tight text-navy">{t("cart.title")}</h1>

        {loading || resolving ? (
          <p className="mt-8 text-sm text-navy-muted">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md px-1 py-8 text-center">
            <ShoppingCart className="mx-auto size-8 text-brand" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-navy">{t("cart.emptyTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-muted">{t("cart.emptyBody")}</p>
            <Link
              to="/browse"
              className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {t("cart.browseCta")}
            </Link>
          </div>
        ) : (
          <>
            {error ? (
              <p className="mt-3 text-sm text-navy" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-5 hidden gap-6 min-[769px]:grid min-[769px]:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] min-[769px]:items-start">
              <ul className="min-w-0 space-y-3">{rows.map((row) => (
                <CartRow
                  key={row.item.id}
                  row={row}
                  selected={selected.has(row.item.listingId)}
                  pending={isPending(row.item.listingId)}
                  onToggle={toggleSelected}
                  onRemove={() => void handleRemove(row.item.listingId)}
                  onQuantity={handleQuantity}
                />
              ))}</ul>
              <div className="sticky top-24">{summary}</div>
            </div>

            <div className="mt-5 min-[769px]:hidden">
              <ul className="min-w-0 space-y-3">{rows.map((row) => (
                <CartRow
                  key={row.item.id}
                  row={row}
                  selected={selected.has(row.item.listingId)}
                  pending={isPending(row.item.listingId)}
                  compact
                  onToggle={toggleSelected}
                  onRemove={() => void handleRemove(row.item.listingId)}
                  onQuantity={handleQuantity}
                />
              ))}</ul>
              <div className="mt-4">{summary}</div>
            </div>
          </>
        )}
    </div>
  )
}

function CartRow({
  row,
  selected,
  pending,
  compact = false,
  onToggle,
  onRemove,
  onQuantity,
}: {
  row: { item: CartItem; listing: CatalogListing | null; purchasable: boolean }
  selected: boolean
  pending: boolean
  compact?: boolean
  onToggle: (listingId: string, purchasable: boolean) => void
  onRemove: () => void
  onQuantity: (listingId: string, nextQty: number, max: number) => void
}) {
  const t = useT()
  const { item, listing, purchasable } = row
  const name = listing?.name ?? t("cart.unavailableName")
  const seller = listing?.seller.name ?? ""
  const price = listing ? listing.price : "—"
  const max = Math.max(1, item.availableQuantity ?? listing?.quantity ?? item.quantity)
  const showStepper = max > 1 && purchasable
  const href = listing && listing.status !== "draft" ? `/motorcycles/${item.listingId}` : undefined

  return (
    <li className="min-w-0 rounded-2xl border border-line bg-white p-3 shadow-card">
      <div className={cn("flex min-w-0 gap-3", compact ? "items-start" : "items-center")}>
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-brand"
          checked={selected}
          disabled={!purchasable}
          aria-label={t("cart.selectItem", { name })}
          onChange={() => onToggle(item.listingId, purchasable)}
        />
        {href ? (
          <Link to={href} className="shrink-0">
            <CartThumb src={listing?.image} alt={name} compact={compact} />
          </Link>
        ) : (
          <CartThumb src={listing?.image} alt={name} compact={compact} />
        )}
        <div className="min-w-0 flex-1">
          {href ? (
            <Link to={href} className="block truncate text-sm font-semibold text-navy hover:text-brand">
              {name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-navy">{name}</p>
          )}
          {seller ? <p className="mt-0.5 truncate text-xs text-navy-muted">{seller}</p> : null}
          <p className="mt-1 text-price font-bold text-brand">{price}</p>
          {purchasable ? null : (
            <p className="mt-1 text-xs font-medium text-navy">{t("cart.unavailable")}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showStepper ? (
              <div className="inline-flex items-center rounded-lg border border-line">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
                  aria-label={t("cart.decreaseQty")}
                  disabled={pending || item.quantity <= 1}
                  onClick={() => onQuantity(item.listingId, item.quantity - 1, max)}
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-7 text-center text-sm font-medium text-navy">{item.quantity}</span>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
                  aria-label={t("cart.increaseQty")}
                  disabled={pending || item.quantity >= max}
                  onClick={() => onQuantity(item.listingId, item.quantity + 1, max)}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-navy-muted">
                {t("cart.quantity")}: {item.quantity}
              </p>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              disabled={pending}
              aria-label={`${t("cart.remove")}: ${name}`}
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              {t("cart.remove")}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function CartThumb({ src, alt, compact }: { src?: string; alt: string; compact: boolean }) {
  return (
    <span
      className={cn(
        "block shrink-0 overflow-hidden rounded-lg bg-surface",
        compact ? "h-[100px] w-[100px]" : "h-24 w-24 sm:h-28 sm:w-28",
      )}
    >
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : null}
    </span>
  )
}
