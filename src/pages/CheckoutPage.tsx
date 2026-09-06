import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AuthInput, AuthTextarea, Field } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { formatIDR, unitsLeftMessage } from "../lib/listingForm"
import { getListingPickupDetails, getPublicListingById } from "../lib/listings"
import { isSellerFleetAvailable } from "../lib/seller"
import { useListingsLive } from "../lib/useListingsLive"
import { useSellerLive } from "../lib/useSellerLive"
import {
  calculateBuyerTotal,
  calculateDiscount,
  calculateSubtotal,
  deliveryFeeLabel,
  deliveryMethodLabel,
  isListingPurchasable,
  listingAvailableQuantity,
  OrderError,
  placeOrder,
  validateCheckoutQuantity,
} from "../lib/orders"
import { useOrdersLive } from "../lib/useOrdersLive"
import type { DeliveryMethod, PaymentMethod } from "../types/order"
import { cn } from "../lib/cn"

export function CheckoutPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  useSellerLive()
  useListingsLive()
  useOrdersLive()

  const listing = listingId ? getPublicListingById(listingId) : undefined
  const available = listing ? listingAvailableQuantity(listing) : 0
  const pickup = listingId ? getListingPickupDetails(listingId) : null
  const fleetAvailable = listing ? isSellerFleetAvailable(listing.sellerId) : false

  const [quantityText, setQuantityText] = useState("1")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryCity, setDeliveryCity] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const placingRef = useRef(false)

  const quantityError = listing ? validateCheckoutQuantity(quantityText, available) : "Motorcycle listing not found."
  const quantity = /^\d+$/.test(quantityText.trim()) ? Number(quantityText.trim()) : 0
  const unitPrice = listing ? Math.round(listing.priceValue) : 0
  const subtotal = calculateSubtotal(unitPrice, Number.isInteger(quantity) && quantity > 0 ? quantity : 0)
  const discountAmount = calculateDiscount(subtotal)
  const buyerTotal = calculateBuyerTotal(subtotal, discountAmount)

  const ownListing = Boolean(user && listing && listing.sellerId === user.id)
  const unavailable = listing ? !isListingPurchasable(listing) : true

  const canSubmit = useMemo(() => {
    if (!user || !listing || ownListing || unavailable) return false
    if (quantityError) return false
    if (deliveryMethod === "seller_fleet") {
      if (!fleetAvailable) return false
      if (!deliveryAddress.trim() || !deliveryCity.trim()) return false
    }
    if (deliveryMethod === "third_party") return false
    return true
  }, [
    user,
    listing,
    ownListing,
    unavailable,
    quantityError,
    deliveryMethod,
    fleetAvailable,
    deliveryAddress,
    deliveryCity,
  ])

  useEffect(() => {
    if (!fleetAvailable && deliveryMethod === "seller_fleet") {
      setDeliveryMethod("pickup")
    }
  }, [fleetAvailable, deliveryMethod])

  function setQuantity(next: number) {
    const max = Math.max(1, available)
    const clamped = Math.min(max, Math.max(1, next))
    setQuantityText(String(clamped))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError("")
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/checkout/${listingId ?? ""}`)}`)
      return
    }
    if (!listing || !listingId) return
    if (ownListing) {
      setFormError("You cannot purchase your own listing.")
      return
    }
    if (quantityError) {
      setFormError(quantityError)
      return
    }
    if (deliveryMethod === "seller_fleet") {
      if (!fleetAvailable) {
        setFormError("Seller Fleet is not available for this listing.")
        return
      }
      if (!deliveryAddress.trim()) {
        setFormError("Delivery address is required.")
        return
      }
      if (!deliveryCity.trim()) {
        setFormError("City is required.")
        return
      }
    }

    placingRef.current = true
    setSubmitting(true)
    try {
      await updateProfile({ phone: phone.trim() })
      const order = await placeOrder({
        listingId,
        buyerId: user.id,
        buyerName: user.fullName,
        buyerEmail: user.email,
        buyerPhone: phone.trim(),
        quantity,
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryNotes: deliveryNotes.trim(),
        paymentMethod,
      })
      setPlacedOrderId(order.id)
      navigate(`/orders/${order.id}`, { replace: true, state: { placed: true } })
    } catch (error) {
      placingRef.current = false
      setSubmitting(false)
      setFormError(error instanceof OrderError || error instanceof Error ? error.message : "Unable to place order.")
    }
  }

  const placing = submitting || placingRef.current || Boolean(placedOrderId)

  if (placing) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Placing your order…</h1>
        </Container>
      </main>
    )
  }

  if (!listing) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Motorcycle listing not found.</h1>
          <Button className="mt-8" onClick={() => navigate("/browse")}>
            Back to Browse
          </Button>
        </Container>
      </main>
    )
  }

  if (unavailable || !isListingPurchasable(listing)) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">This motorcycle is no longer available.</h1>
          <Button className="mt-8" onClick={() => navigate("/browse")}>
            Back to Browse
          </Button>
        </Container>
      </main>
    )
  }

  const sellerName = listing.seller.name
  const cover = listing.image

  return (
    <main className="bg-white pb-24 sm:pb-20">
      <Container className="pt-8 sm:pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Checkout</h1>
          <p className="mt-2 text-navy-muted">Review the motorcycle and place your order.</p>

          {ownListing ? (
            <p className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-navy" role="alert">
              You cannot purchase your own listing.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-6" noValidate>
            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Motorcycle Summary</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                <div className="h-40 w-full overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-40 sm:shrink-0">
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{listing.name}</p>
                  <p className="mt-1 text-sm text-navy-muted">
                    {[listing.brand, listing.model].filter(Boolean).join(" · ") || listing.category}
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">
                    {listing.year} · {listing.location}
                  </p>
                  <p className="mt-2 text-sm text-navy">
                    Seller: <span className="font-medium">{sellerName}</span>
                  </p>
                  <p className="mt-2 text-base font-semibold text-brand">{formatIDR(unitPrice)}</p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Available: {available} {available === 1 ? "unit" : "units"}
                  </p>
                  <Link
                    to={`/motorcycles/${listing.id}`}
                    className="mt-3 inline-flex text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    View Listing
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Quantity</h2>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-lg border border-line text-lg text-navy hover:bg-surface"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(quantity - 1)}
                >
                  −
                </button>
                <input
                  id="checkout-quantity"
                  aria-label="Quantity"
                  inputMode="numeric"
                  className={cn(
                    "h-11 w-20 rounded-lg border bg-white text-center text-sm text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20",
                    quantityError ? "border-red-300" : "border-line",
                  )}
                  value={quantityText}
                  onChange={(event) => setQuantityText(event.target.value)}
                />
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-lg border border-line text-lg text-navy hover:bg-surface"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((Number.isInteger(quantity) ? quantity : 1) + 1)}
                >
                  +
                </button>
              </div>
              {quantityError ? (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {quantityError}
                </p>
              ) : (
                <p className="mt-2 text-sm text-navy-muted">{unitsLeftMessage(available)}</p>
              )}
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Buyer Information</h2>
              <div className="mt-4 grid gap-4">
                <Field label="Full Name" htmlFor="checkout-name">
                  <AuthInput id="checkout-name" value={user?.fullName ?? ""} readOnly />
                </Field>
                <Field label="Email" htmlFor="checkout-email">
                  <AuthInput id="checkout-email" type="email" value={user?.email ?? ""} readOnly />
                </Field>
                <Field label="Phone Number" htmlFor="checkout-phone">
                  <AuthInput
                    id="checkout-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </Field>
                {deliveryMethod !== "seller_fleet" ? (
                  <Field label="Delivery Notes" htmlFor="checkout-notes" optional>
                    <AuthTextarea
                      id="checkout-notes"
                      value={deliveryNotes}
                      onChange={(event) => setDeliveryNotes(event.target.value)}
                    />
                  </Field>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Delivery Method</h2>
              <div className="mt-4 grid gap-3">
                <DeliveryOption
                  id="delivery-pickup"
                  checked={deliveryMethod === "pickup"}
                  title="Pickup at Showroom"
                  description="Pick up directly from the seller/showroom."
                  onSelect={() => setDeliveryMethod("pickup")}
                />
                {fleetAvailable ? (
                  <DeliveryOption
                    id="delivery-fleet"
                    checked={deliveryMethod === "seller_fleet"}
                    title="Seller Fleet"
                    description="Delivery is provided directly by the seller."
                    onSelect={() => setDeliveryMethod("seller_fleet")}
                  />
                ) : null}
                <DeliveryOption
                  id="delivery-third"
                  checked={false}
                  disabled
                  title="Third-Party Logistics"
                  description="Third-party delivery partners will be available in a future release."
                  badge="Coming Soon"
                  onSelect={() => undefined}
                />
              </div>

              {deliveryMethod === "pickup" ? (
                <div className="mt-5 rounded-xl border border-line bg-surface px-4 py-4">
                  <p className="text-sm font-semibold text-navy">Pickup Location</p>
                  <p className="mt-2 text-sm text-navy">{pickup?.businessName || sellerName}</p>
                  <p className="mt-1 text-sm text-navy-muted">
                    {pickup?.address ? `${pickup.address}, ` : ""}
                    {pickup?.city || pickup?.location || listing.location}
                  </p>
                </div>
              ) : null}

              {deliveryMethod === "seller_fleet" ? (
                <div className="mt-5 grid gap-4">
                  <p className="text-sm text-navy-muted">Delivery is provided directly by the seller.</p>
                  <Field label="Delivery Address" htmlFor="checkout-address">
                    <AuthInput
                      id="checkout-address"
                      value={deliveryAddress}
                      invalid={!deliveryAddress.trim() && Boolean(formError)}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                    />
                  </Field>
                  <Field label="City" htmlFor="checkout-city">
                    <AuthInput
                      id="checkout-city"
                      value={deliveryCity}
                      invalid={!deliveryCity.trim() && Boolean(formError)}
                      onChange={(event) => setDeliveryCity(event.target.value)}
                    />
                  </Field>
                  <Field label="Additional Delivery Notes" htmlFor="checkout-fleet-notes" optional>
                    <AuthTextarea
                      id="checkout-fleet-notes"
                      value={deliveryNotes}
                      onChange={(event) => setDeliveryNotes(event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Payment Method</h2>
              <p className="mt-2 text-sm text-navy-muted">Payment processing will be available in a future release.</p>
              <div className="mt-4 grid gap-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3">
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                  />
                  <span className="text-sm font-medium text-navy">Bank Transfer</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3">
                  <input
                    type="radio"
                    name="payment"
                    className="mt-1"
                    checked={paymentMethod === "discuss_with_seller"}
                    onChange={() => setPaymentMethod("discuss_with_seller")}
                  />
                  <span className="text-sm font-medium text-navy">Other / Discuss with Seller</span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Discount</h2>
              <p className="mt-2 text-sm text-navy-muted">Discounts will be available in a future release.</p>
              <Button type="button" variant="secondary" className="mt-4" disabled>
                Apply Discount
              </Button>
              <p className="mt-2 text-xs text-navy-muted">Coming Soon</p>
            </section>

            <section className="rounded-2xl border border-line px-5 py-6 sm:px-6">
              <h2 className="text-lg font-bold text-navy">Price Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <SummaryRow label="Unit Price" value={formatIDR(unitPrice)} />
                <SummaryRow label="Quantity" value={String(Number.isInteger(quantity) && quantity > 0 ? quantity : "—")} />
                <SummaryRow label="Subtotal" value={formatIDR(subtotal)} />
                <SummaryRow label="Discount" value={`-${formatIDR(discountAmount)}`} />
              </dl>
              <div className="mt-4 border-t border-line pt-4">
                <SummaryRow label="Total" value={formatIDR(buyerTotal)} strong />
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-semibold text-navy">Delivery</p>
                <p className="mt-2 text-sm text-navy">{deliveryMethodLabel(deliveryMethod)}</p>
                <p className="mt-1 text-sm text-navy-muted">
                  Delivery Fee: {deliveryFeeLabel({ deliveryMethod, deliveryFee: 0 })}
                </p>
              </div>
            </section>

            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="sticky bottom-0 z-10 -mx-5 border-t border-line bg-white px-5 py-4 sm:static sm:mx-0 sm:border-0 sm:p-0">
              <Button type="submit" className="w-full py-3" disabled={!canSubmit || submitting || ownListing}>
                {submitting ? "Placing order..." : "Place Order"}
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </main>
  )
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-navy" : "text-navy-muted"}>{label}</dt>
      <dd className={strong ? "font-semibold text-navy" : "font-medium text-navy"}>{value}</dd>
    </div>
  )
}

function DeliveryOption({
  id,
  checked,
  title,
  description,
  badge,
  disabled,
  onSelect,
}: {
  id: string
  checked: boolean
  title: string
  description: string
  badge?: string
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        disabled ? "cursor-not-allowed border-line bg-surface opacity-70" : "cursor-pointer border-line",
      )}
    >
      <input
        id={id}
        type="radio"
        name="delivery"
        className="mt-1"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-navy">{title}</span>
          {badge ? <span className="rounded-full bg-white px-2 py-0.5 text-xs text-navy-muted">{badge}</span> : null}
        </span>
        <span className="mt-1 block text-sm text-navy-muted">{description}</span>
      </span>
    </label>
  )
}
