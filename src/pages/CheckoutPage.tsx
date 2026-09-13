import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BadgeCheck, Headphones, Lock, MapPin, RotateCcw, ShieldCheck } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { AuthInput, AuthTextarea, Field } from "../components/auth/AuthField"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { formatIDR } from "../lib/listingForm"
import { catalogValue, useLanguage } from "../i18n"
import { ensureRemoteListing, getListingPickupDetails, getPublicListingById } from "../lib/listings"
import { isSellerFleetAvailable } from "../lib/seller"
import { isSupabaseConfigured } from "../lib/supabase"
import { useListingsLive } from "../lib/useListingsLive"
import { useSellerLive } from "../lib/useSellerLive"
import {
  calculateBuyerTotal,
  calculateDiscount,
  calculateSubtotal,
  isListingPurchasable,
  listingAvailableQuantity,
  orderPublicRef,
  OrderError,
  placeOrder,
  validateCheckoutQuantity,
} from "../lib/orders"
import { useOrdersLive } from "../lib/useOrdersLive"
import type { DeliveryMethod, PaymentMethod } from "../types/order"
import { cn } from "../lib/cn"

const INSTALLMENT_MONTHS = [3, 6, 12, 24] as const

type PayTab = "bank" | "card" | "installment" | "other"

function estimateMonthly(amount: number, months: number) {
  if (amount <= 0 || months < 1) return 0
  return Math.round(amount / months)
}

export function CheckoutPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const { items, hasListing, loading: cartLoading } = useCart()
  const { locale, t, tm } = useLanguage()
  useSellerLive()
  useListingsLive()
  useOrdersLive()

  const listing = listingId ? getPublicListingById(listingId) : undefined
  const available = listing ? listingAvailableQuantity(listing) : 0
  const pickup = listingId ? getListingPickupDetails(listingId) : null
  const fleetAvailable = listing ? isSellerFleetAvailable(listing.sellerId) : false
  const cartLine = listingId ? items.find((row) => row.listingId === listingId) : undefined

  const [lookingUp, setLookingUp] = useState(false)
  const [quantityText, setQuantityText] = useState("1")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryCity, setDeliveryCity] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer")
  const [payTab, setPayTab] = useState<PayTab>("bank")
  const [installmentMonths, setInstallmentMonths] = useState<(typeof INSTALLMENT_MONTHS)[number]>(6)
  const [agreed, setAgreed] = useState(false)
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const placingRef = useRef(false)
  const qtyHydrated = useRef<string | null>(null)

  useEffect(() => {
    if (!listingId || !isSupabaseConfigured() || listing) {
      setLookingUp(false)
      return
    }
    let cancelled = false
    setLookingUp(true)
    void ensureRemoteListing(listingId).finally(() => {
      if (!cancelled) setLookingUp(false)
    })
    return () => {
      cancelled = true
    }
  }, [listingId, listing])

  useEffect(() => {
    qtyHydrated.current = null
    setAgreed(false)
    setFormError("")
    setPayTab("bank")
    setPaymentMethod("bank_transfer")
  }, [listingId])

  useEffect(() => {
    if (!listingId || !cartLine || qtyHydrated.current === listingId) return
    qtyHydrated.current = listingId
    setQuantityText(String(Math.max(1, cartLine.quantity)))
  }, [cartLine, listingId])

  const quantityError = listing ? validateCheckoutQuantity(quantityText, available) : t("listing.notFound")
  const quantity = /^\d+$/.test(quantityText.trim()) ? Number(quantityText.trim()) : 0
  const unitPrice = listing ? Math.round(listing.priceValue) : 0
  const subtotal = calculateSubtotal(unitPrice, Number.isInteger(quantity) && quantity > 0 ? quantity : 0)
  const discountAmount = calculateDiscount(subtotal)
  const buyerTotal = calculateBuyerTotal(subtotal, discountAmount)

  const ownListing = Boolean(user && listing && listing.sellerId === user.id)
  const unavailable = listing ? !isListingPurchasable(listing) : true
  const paymentReady = payTab === "bank" || payTab === "other"

  const canSubmit = useMemo(() => {
    if (!user || !listing || ownListing || unavailable) return false
    if (quantityError) return false
    if (!agreed || !paymentReady) return false
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
    agreed,
    paymentReady,
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

  function selectPayTab(next: PayTab) {
    setPayTab(next)
    if (next === "bank") setPaymentMethod("bank_transfer")
    if (next === "other") setPaymentMethod("discuss_with_seller")
    if (next === "installment") {
      window.requestAnimationFrame(() => {
        document.getElementById("checkout-installment")?.scrollIntoView({ block: "nearest" })
      })
    }
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
      setFormError(t("listing.cannotBuyOwn"))
      return
    }
    if (!agreed) {
      setFormError(t("checkout.agree"))
      return
    }
    if (!paymentReady) {
      setFormError(t("checkout.selectPaymentToPlace"))
      return
    }
    if (quantityError) {
      setFormError(quantityError ? tm(quantityError) : "")
      return
    }
    if (deliveryMethod === "seller_fleet") {
      if (!fleetAvailable) {
        setFormError(t("checkout.fleetUnavailable"))
        return
      }
      if (!deliveryAddress.trim()) {
        setFormError(t("checkout.addressRequired"))
        return
      }
      if (!deliveryCity.trim()) {
        setFormError(t("checkout.cityRequired"))
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
      setPlacedOrderId(orderPublicRef(order))
      navigate(`/orders/${orderPublicRef(order)}`, { replace: true, state: { placed: true } })
    } catch (error) {
      placingRef.current = false
      setSubmitting(false)
      setFormError(error instanceof OrderError || error instanceof Error ? tm(error.message, "checkout.unablePlace") : t("checkout.unablePlace"))
    }
  }

  const placing = submitting || placingRef.current || Boolean(placedOrderId)

  if (placing) {
    return (
      <main className="min-w-0 bg-surface py-16">
        <Container className="max-w-xl text-center">
          <h1 className="text-heading font-bold tracking-tight text-navy">{t("checkout.placing")}</h1>
        </Container>
      </main>
    )
  }

  if (!listing && lookingUp) {
    return (
      <main className="min-w-0 bg-surface py-16">
        <Container className="max-w-xl text-center">
          <p className="text-navy-muted">{t("common.loading")}</p>
        </Container>
      </main>
    )
  }

  if (!listing) {
    return (
      <main className="min-w-0 bg-surface py-16">
        <Container className="max-w-xl text-center">
          <h1 className="text-heading font-bold tracking-tight text-navy">{t("listing.notFound")}</h1>
          <p className="mt-2 text-navy-muted">{t("listing.notFoundBody")}</p>
          <Button className="mt-8" onClick={() => navigate("/browse")}>
            {t("listing.returnBrowse")}
          </Button>
        </Container>
      </main>
    )
  }

  if (unavailable || !isListingPurchasable(listing)) {
    return (
      <main className="min-w-0 bg-surface py-16">
        <Container className="max-w-xl text-center">
          <h1 className="text-heading font-bold tracking-tight text-navy">{t("listing.unavailable")}</h1>
          <Button className="mt-8" onClick={() => navigate("/cart")}>
            {t("checkout.goToCart")}
          </Button>
        </Container>
      </main>
    )
  }

  const sellerName = listing.seller.name
  const cover = listing.image
  const sellerCity = pickup?.city || listing.location
  const showroom = pickup?.address
  const variantBits = [listing.color, listing.condition ? catalogValue(locale, listing.condition) : "", listing.year]
    .filter(Boolean)
    .join(" · ")
  const showCartMismatch = !cartLoading && !hasListing(listing.id)

  const installmentPanel = (
    <InstallmentPanel amount={subtotal} months={installmentMonths} onSelect={setInstallmentMonths} />
  )

  const summaryCard = (
    <CheckoutCard>
      <SectionTitle>{t("checkout.orderSummary")}</SectionTitle>
      <dl className="mt-3 space-y-1.5">
        <SummaryRow
          label={`${t("orders.subtotal")} (${t("checkout.qtyCol")} ${Number.isInteger(quantity) && quantity > 0 ? quantity : "—"})`}
          value={formatIDR(subtotal)}
        />
        <SummaryRow label={t("checkout.protectionFee")} value={t("checkout.comingSoon")} muted />
        <SummaryRow
          label={t("checkout.shipping")}
          value={deliveryMethod === "pickup" ? formatIDR(0) : t("checkout.comingSoon")}
          muted={deliveryMethod !== "pickup"}
        />
        <SummaryRow label={t("checkout.voucherDiscount")} value={`-${formatIDR(0)}`} muted />
        <SummaryRow label={t("checkout.coinsDiscount")} value={`-${formatIDR(0)}`} muted />
        {discountAmount > 0 ? <SummaryRow label={t("orders.discount")} value={`-${formatIDR(discountAmount)}`} /> : null}
      </dl>
      <div className="mt-3 border-t border-line pt-3">
        <SummaryRow label={t("checkout.totalPayment")} value={formatIDR(buyerTotal)} strong />
      </div>
      <label className="mt-4 flex min-w-0 items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-3.5 shrink-0 accent-brand"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span className="text-ui text-navy">
          {t("checkout.agree")}{" "}
          <Link to="/#terms" className="font-medium text-brand hover:text-brand-hover">
            {t("footer.terms")}
          </Link>
        </span>
      </label>
      {formError ? (
        <p className="mt-2 text-ui text-navy" role="alert">
          {formError}
        </p>
      ) : null}
      {!paymentReady ? (
        <p className="mt-2 text-ui text-navy-muted">{t("checkout.selectPaymentToPlace")}</p>
      ) : null}
      <Button type="submit" className="mt-4 min-h-11 w-full" disabled={!canSubmit || submitting || ownListing}>
        {submitting ? t("checkout.placingBtn") : t("checkout.placeOrder")}
      </Button>
      <p className="mt-2 flex items-start gap-1.5 text-ui text-navy-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t("checkout.secureNote")}
      </p>
    </CheckoutCard>
  )

  const benefitsCard = (
    <CheckoutCard>
      <SectionTitle>{t("checkout.whyTitle")}</SectionTitle>
      <ul className="mt-3 space-y-2 text-ui text-navy">
        <Benefit icon={<BadgeCheck className="size-3.5 shrink-0 text-brand" />} text={t("checkout.whyVerified")} />
        <Benefit icon={<ShieldCheck className="size-3.5 shrink-0 text-brand" />} text={t("checkout.whySecure")} />
        <Benefit icon={<Headphones className="size-3.5 shrink-0 text-brand" />} text={t("checkout.whySupport")} />
        <Benefit icon={<RotateCcw className="size-3.5 shrink-0 text-brand" />} text={t("checkout.whyReturns")} />
      </ul>
    </CheckoutCard>
  )

  return (
    <main className="min-w-0 bg-surface pb-24 lg:pb-12">
      <Container className="pt-6 sm:pt-8">
        <div className="min-w-0">
          <h1 className="text-heading font-bold tracking-tight text-navy">{t("checkout.title")}</h1>
          <p className="mt-1 text-navy-muted">{t("checkout.subtitle")}</p>
          <CheckoutProgress />

          {ownListing ? (
            <p className="mt-4 rounded-xl border border-line bg-white px-4 py-3 text-ui font-medium text-navy" role="alert">
              {t("listing.cannotBuyOwn")}
            </p>
          ) : null}

          {showCartMismatch ? (
            <p className="mt-4 rounded-xl border border-line bg-white px-4 py-3 text-ui text-navy" role="status">
              {t("checkout.notInCart")}{" "}
              <Link to="/cart" className="font-medium text-brand hover:text-brand-hover">
                {t("checkout.goToCart")}
              </Link>
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-4 min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16.5rem,21rem)] lg:items-start lg:gap-4" noValidate>
            <div className="grid min-w-0 gap-3">
              <CheckoutCard>
                <SectionTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-brand" aria-hidden />
                    {t("checkout.pickupDelivery")}
                  </span>
                </SectionTitle>
                <dl className="mt-3 space-y-2 text-ui">
                  <div>
                    <dt className="text-navy-muted">{t("checkout.sellerLocation")}</dt>
                    <dd className="mt-0.5 font-medium text-navy">{sellerCity || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-muted">{t("checkout.showroom")}</dt>
                    <dd className="mt-0.5 font-medium text-navy">{showroom || pickup?.businessName || sellerName}</dd>
                  </div>
                  <div>
                    <dt className="text-navy-muted">{t("checkout.deliveryService")}</dt>
                    <dd className="mt-0.5">
                      <SoonBadge />
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-ui text-navy-muted">{t("checkout.pickupArrange")}</p>
                <div className="mt-3 grid gap-2">
                  <DeliveryOption
                    id="delivery-pickup"
                    checked={deliveryMethod === "pickup"}
                    title={t("orders.pickupShowroom")}
                    description={t("checkout.pickupDesc")}
                    onSelect={() => setDeliveryMethod("pickup")}
                  />
                  {fleetAvailable ? (
                    <DeliveryOption
                      id="delivery-fleet"
                      checked={deliveryMethod === "seller_fleet"}
                      title={t("orders.sellerFleet")}
                      description={t("checkout.fleetDesc")}
                      onSelect={() => setDeliveryMethod("seller_fleet")}
                    />
                  ) : null}
                  <DeliveryOption
                    id="delivery-third"
                    checked={false}
                    disabled
                    title={t("orders.thirdParty")}
                    description={t("checkout.thirdDesc")}
                    badge={t("checkout.comingSoon")}
                    onSelect={() => undefined}
                  />
                </div>
                {deliveryMethod === "seller_fleet" ? (
                  <div className="mt-3 grid gap-3">
                    <Field label={t("orders.deliveryAddress")} htmlFor="checkout-address">
                      <AuthInput
                        id="checkout-address"
                        value={deliveryAddress}
                        invalid={!deliveryAddress.trim() && Boolean(formError)}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                      />
                    </Field>
                    <Field label={t("orders.city")} htmlFor="checkout-city">
                      <AuthInput
                        id="checkout-city"
                        value={deliveryCity}
                        invalid={!deliveryCity.trim() && Boolean(formError)}
                        onChange={(event) => setDeliveryCity(event.target.value)}
                      />
                    </Field>
                    <Field label={t("checkout.additionalNotes")} htmlFor="checkout-fleet-notes" optional>
                      <AuthTextarea
                        id="checkout-fleet-notes"
                        value={deliveryNotes}
                        onChange={(event) => setDeliveryNotes(event.target.value)}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3">
                    <Field label={t("checkout.phone")} htmlFor="checkout-phone">
                      <AuthInput
                        id="checkout-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </Field>
                    <Field label={t("checkout.deliveryNotes")} htmlFor="checkout-notes" optional>
                      <AuthTextarea
                        id="checkout-notes"
                        value={deliveryNotes}
                        onChange={(event) => setDeliveryNotes(event.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </CheckoutCard>

              <CheckoutCard>
                <SectionTitle>{t("checkout.items")}</SectionTitle>
                <div className="mt-3 min-w-0">
                  <div className="hidden text-ui text-navy-muted sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_6.5rem] sm:gap-2">
                    <span>{t("checkout.product")}</span>
                    <span className="text-right">{t("checkout.unitPriceCol")}</span>
                    <span className="text-center">{t("checkout.qtyCol")}</span>
                    <span className="text-right">{t("checkout.subtotalCol")}</span>
                  </div>
                  <div className="mt-2 flex min-w-0 flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_6.5rem] sm:items-center sm:gap-2">
                    <div className="flex min-w-0 gap-3">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface sm:size-14">
                        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-card-title font-semibold text-navy">{listing.name}</p>
                        <p className="mt-0.5 text-ui text-navy-muted">
                          {t("listing.seller")}: {sellerName}
                        </p>
                        <p className="mt-0.5 text-ui text-navy-muted">
                          {[listing.brand, listing.model].filter(Boolean).join(" · ")}
                        </p>
                        {variantBits ? <p className="mt-0.5 text-ui text-navy-muted">{variantBits}</p> : null}
                        <Link to={`/motorcycles/${listing.id}`} className="mt-1 inline-flex text-ui font-medium text-brand hover:text-brand-hover">
                          {t("checkout.viewListing")}
                        </Link>
                      </div>
                    </div>
                    <p className="text-ui font-medium text-navy sm:text-right">{formatIDR(unitPrice)}</p>
                    <div className="flex items-center justify-start gap-1 sm:justify-center">
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-md border border-line text-navy hover:bg-surface"
                        aria-label={t("checkout.decrease")}
                        onClick={() => setQuantity(quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        id="checkout-quantity"
                        aria-label={t("checkout.quantity")}
                        inputMode="numeric"
                        className={cn(
                          "h-8 w-10 rounded-md border bg-white text-center text-ui text-navy focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20",
                          quantityError ? "border-red-300" : "border-line",
                        )}
                        value={quantityText}
                        onChange={(event) => setQuantityText(event.target.value)}
                      />
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-md border border-line text-navy hover:bg-surface"
                        aria-label={t("checkout.increase")}
                        onClick={() => setQuantity((Number.isInteger(quantity) ? quantity : 1) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-ui font-semibold text-navy sm:text-right">{formatIDR(subtotal)}</p>
                  </div>
                  {quantityError ? (
                    <p className="mt-2 text-ui text-navy" role="alert">
                      {tm(quantityError)}
                    </p>
                  ) : null}
                </div>
              </CheckoutCard>

              <CheckoutCard>
                <div className="flex flex-wrap items-center gap-2">
                  <SectionTitle>{t("checkout.protection")}</SectionTitle>
                  <span className="text-ui text-navy-muted">{t("checkout.optional")}</span>
                  <SoonBadge />
                </div>
                <label className="mt-3 flex cursor-not-allowed items-start gap-2 opacity-70">
                  <input type="checkbox" disabled className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <span className="block text-card-title font-medium text-navy">{t("checkout.protectionProduct")}</span>
                    <span className="mt-0.5 block text-ui text-navy-muted">{t("checkout.protectionBody")}</span>
                  </span>
                </label>
              </CheckoutCard>

              <CheckoutCard>
                <div className="flex flex-wrap items-center gap-2">
                  <SectionTitle>{t("checkout.voucher")}</SectionTitle>
                  <SoonBadge />
                </div>
                <div className="mt-3 flex min-w-0 gap-2">
                  <input
                    disabled
                    placeholder={t("checkout.voucherPlaceholder")}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-ui text-navy-muted"
                  />
                  <Button type="button" variant="secondary" className="h-10 shrink-0 px-3" disabled>
                    {t("checkout.voucherApply")}
                  </Button>
                </div>
              </CheckoutCard>

              <CheckoutCard>
                <div className="flex flex-wrap items-center gap-2">
                  <SectionTitle>{t("checkout.coins")}</SectionTitle>
                  <SoonBadge />
                </div>
                <label className="mt-3 flex cursor-not-allowed items-start gap-2 opacity-70">
                  <input type="checkbox" disabled className="mt-0.5 size-3.5 shrink-0" />
                  <span className="text-ui text-navy-muted">{t("checkout.coinsBody")}</span>
                </label>
              </CheckoutCard>

              <CheckoutCard>
                <SectionTitle>{t("checkout.paymentMethod")}</SectionTitle>
                <div className="-mx-1 mt-3 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                  {(
                    [
                      ["bank", t("checkout.payBank")],
                      ["card", t("checkout.payCard")],
                      ["installment", t("checkout.payInstallment")],
                      ["other", t("checkout.payOther")],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-2 text-ui font-medium",
                        payTab === id ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-navy",
                      )}
                      onClick={() => selectPayTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  {payTab === "bank" ? (
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2.5">
                      <input
                        type="radio"
                        name="payment"
                        className="mt-0.5"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                      />
                      <span>
                        <span className="block text-card-title font-medium text-navy">{t("orders.bankTransfer")}</span>
                        <span className="mt-0.5 block text-ui text-navy-muted">{t("checkout.bankManual")}</span>
                      </span>
                    </label>
                  ) : null}
                  {payTab === "card" ? (
                    <p className="text-ui text-navy-muted">
                      {t("checkout.payCard")} · <SoonBadge />
                    </p>
                  ) : null}
                  {payTab === "installment" ? (
                    <p className="text-ui text-navy-muted">{t("checkout.installmentSim")}</p>
                  ) : null}
                  {payTab === "other" ? (
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2.5">
                      <input
                        type="radio"
                        name="payment"
                        className="mt-0.5"
                        checked={paymentMethod === "discuss_with_seller"}
                        onChange={() => setPaymentMethod("discuss_with_seller")}
                      />
                      <span>
                        <span className="block text-card-title font-medium text-navy">{t("orders.otherPayment")}</span>
                        <span className="mt-0.5 block text-ui text-navy-muted">{t("orders.paymentPendingNote")}</span>
                      </span>
                    </label>
                  ) : null}
                </div>
              </CheckoutCard>
            </div>

            <aside className="grid min-w-0 gap-3 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1">
              <div className="order-2 lg:order-1">{summaryCard}</div>
              <div id="checkout-installment" className="order-1 lg:order-2">
                {installmentPanel}
              </div>
              <div className="order-3">{benefitsCard}</div>
            </aside>
          </form>
        </div>
      </Container>
    </main>
  )
}

function CheckoutCard({ children }: { children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-line bg-white p-4">{children}</section>
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-section font-semibold text-navy">{children}</h2>
}

function SoonBadge() {
  const { t } = useLanguage()
  return (
    <span className="inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-ui font-medium text-brand">
      {t("checkout.comingSoon")}
    </span>
  )
}

function CheckoutProgress() {
  const { t } = useLanguage()
  const steps = [
    { n: 1, label: t("checkout.stepCheckout"), active: true },
    { n: 2, label: t("checkout.stepPayment"), active: false },
    { n: 3, label: t("checkout.stepComplete"), active: false },
  ]
  return (
    <ol className="mt-4 flex min-w-0 items-center gap-2 text-ui">
      {steps.map((step, index) => (
        <li key={step.n} className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-ui font-semibold",
              step.active ? "bg-brand text-white" : "bg-white text-navy-muted ring-1 ring-line",
            )}
          >
            {step.n}
          </span>
          <span className={cn("truncate", step.active ? "font-medium text-navy" : "text-navy-muted")}>{step.label}</span>
          {index < steps.length - 1 ? <span className="hidden h-px w-6 bg-line sm:block" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  )
}

function InstallmentPanel({
  amount,
  months,
  onSelect,
}: {
  amount: number
  months: (typeof INSTALLMENT_MONTHS)[number]
  onSelect: (value: (typeof INSTALLMENT_MONTHS)[number]) => void
}) {
  const { t } = useLanguage()
  return (
    <CheckoutCard>
      <div className="flex flex-wrap items-center gap-2">
        <SectionTitle>{t("checkout.installmentSim")}</SectionTitle>
        <SoonBadge />
      </div>
      <p className="mt-1 text-ui text-navy-muted">{t("checkout.installmentProvider")}</p>
      <div className="mt-3 grid gap-2">
        {INSTALLMENT_MONTHS.map((term) => (
          <label
            key={term}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2",
              months === term ? "border-brand bg-brand-soft" : "border-line",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <input type="radio" name="installment-term" checked={months === term} onChange={() => onSelect(term)} />
              <span className="text-ui font-medium text-navy">{t("checkout.installmentMonths", { count: term })}</span>
            </span>
            <span className="shrink-0 text-ui font-semibold text-navy">{formatIDR(estimateMonthly(amount, term))}</span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-ui font-medium text-navy">
        {t("checkout.installmentEstimate")}: {formatIDR(estimateMonthly(amount, months))}
      </p>
      <p className="mt-1 text-ui text-navy-muted">{t("checkout.installmentDisclaimer")}</p>
    </CheckoutCard>
  )
}

function Benefit({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex min-w-0 items-start gap-2">
      {icon}
      <span>{text}</span>
    </li>
  )
}

function SummaryRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string
  value: string
  strong?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={strong ? "text-card-title font-semibold text-navy" : "text-ui text-navy-muted"}>{label}</dt>
      <dd
        className={cn(
          "text-right",
          strong ? "text-price font-semibold text-brand" : "text-ui font-medium text-navy",
          muted && "text-navy-muted",
        )}
      >
        {value}
      </dd>
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
        "flex items-start gap-2 rounded-lg border px-3 py-2.5",
        disabled ? "cursor-not-allowed border-line bg-surface opacity-70" : "cursor-pointer border-line",
      )}
    >
      <input id={id} type="radio" name="delivery" className="mt-0.5" checked={checked} disabled={disabled} onChange={onSelect} />
      <span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-card-title font-medium text-navy">{title}</span>
          {badge ? <SoonBadge /> : null}
        </span>
        <span className="mt-0.5 block text-ui text-navy-muted">{description}</span>
      </span>
    </label>
  )
}
