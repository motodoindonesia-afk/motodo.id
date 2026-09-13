import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge"
import { Button } from "../components/ui/Button"
import { startBuyerConversation } from "../lib/chat"
import { formatIDR } from "../lib/listingForm"
import { getListingPickupDetails } from "../lib/listings"
import {
  catalogFromOrder,
  canBuyerViewOrder,
  formatOrderDate,
  getOrderById,
  orderPublicRef,
} from "../lib/orders"
import { useLanguage, type Translate } from "../i18n"
import type { DeliveryMethod, PaymentMethod, PaymentStatus } from "../types/order"
import { OrderReviewSection } from "../components/reviews/OrderReviewSection"
import { useOrdersLive } from "../lib/useOrdersLive"
import { useReviewsLive } from "../lib/useReviewsLive"
import { useEffect, useState } from "react"

function deliveryLabel(t: Translate, method: DeliveryMethod) {
  if (method === "pickup") return t("orders.pickupShowroom")
  if (method === "seller_fleet") return t("orders.sellerFleet")
  return t("orders.thirdParty")
}

function paymentLabel(t: Translate, method: PaymentMethod) {
  return method === "bank_transfer" ? t("orders.bankTransfer") : t("orders.otherPayment")
}

function paymentStatusText(t: Translate, status?: PaymentStatus) {
  if (status === "paid") return t("orders.paid")
  if (status === "failed") return t("orders.failed")
  if (status === "refunded") return t("orders.refunded")
  return t("orders.pending")
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  useOrdersLive()
  useReviewsLive()
  const [chatNote, setChatNote] = useState("")
  const placed = Boolean((location.state as { placed?: boolean } | null)?.placed)
  const order = orderId ? getOrderById(orderId) : null

  useEffect(() => {
    if (location.hash === "#review" && order && user && canBuyerViewOrder(order, user.id)) {
      document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [location.hash, order, user])

  if (!user) {
    return <h1 className="text-heading font-semibold tracking-tight text-navy">{t("orders.loading")}</h1>
  }

  if (!order) {
    return (
      <div className="min-w-0">
        <h1 className="text-heading font-semibold tracking-tight text-navy">{t("orders.notFound")}</h1>
        <Button className="mt-6" onClick={() => navigate("/orders")}>
          {t("orders.viewMy")}
        </Button>
      </div>
    )
  }

  if (!canBuyerViewOrder(order, user.id)) {
    return (
      <div className="min-w-0">
        <h1 className="text-heading font-semibold tracking-tight text-navy">{t("orders.noPermission")}</h1>
        <Button className="mt-6" onClick={() => navigate("/orders")}>
          {t("orders.viewMy")}
        </Button>
      </div>
    )
  }

  const currentUser = user
  const currentOrder = order
  const pickup = getListingPickupDetails(currentOrder.listingId)

  async function handleChatSeller() {
    const listing = catalogFromOrder(currentOrder)
    const started = await startBuyerConversation(listing, currentUser.id)
    if ("error" in started) {
      setChatNote(
        started.error === "self" ? t("listing.cannotChatSelf") : t("listing.unavailable"),
      )
      return
    }
    navigate(`/messages/${started.conversation.id}`)
  }

  return (
    <div className="min-w-0">
          <h1 className="text-heading font-semibold tracking-tight text-navy">
            {placed ? t("orders.placed") : t("orders.details")}
          </h1>
          <p className="mt-2 text-sm text-navy-muted">
            {t("orders.orderNumberLabel")} <span className="font-medium text-navy">{orderPublicRef(order)}</span>
          </p>
          <div className="mt-3">
            <OrderStatusBadge status={order.status} />
          </div>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.motorcycle")}</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="h-40 w-full overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-40 sm:shrink-0">
                {order.listingImage ? (
                  <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-navy">{order.listingName}</p>
                <p className="mt-2 text-sm text-navy-muted">{t("orders.quantityLabel", { count: order.quantity })}</p>
                <p className="mt-1 text-sm text-navy-muted">{t("orders.unitPrice")}: {formatIDR(order.unitPrice)}</p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.priceSummary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("orders.subtotal")} value={formatIDR(order.subtotal)} />
              <Row label={t("orders.discount")} value={formatIDR(order.discountAmount)} />
              <Row label={t("orders.total")} value={formatIDR(order.buyerTotal)} strong />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.delivery")}</h2>
            <p className="mt-3 text-sm font-medium text-navy">{deliveryLabel(t, order.deliveryMethod)}</p>
            {order.deliveryMethod === "pickup" ? (
              <div className="mt-3 text-sm text-navy-muted">
                <p>{pickup.businessName || t("orders.sellerShowroom")}</p>
                <p className="mt-1">
                  {pickup.address ? `${pickup.address}, ` : ""}
                  {pickup.city || pickup.location}
                </p>
                <p className="mt-2">{t("orders.deliveryFee")}: {t("orders.feeNA")}</p>
              </div>
            ) : null}
            {order.deliveryMethod === "seller_fleet" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                <p>{t("orders.deliveryAddress")}: {order.deliveryAddress || "—"}</p>
                <p>{t("orders.city")}: {order.deliveryCity || "—"}</p>
                {order.deliveryNotes ? <p>{t("orders.deliveryNotes")}: {order.deliveryNotes}</p> : null}
                <p>{t("orders.deliveryFee")}: {t("orders.feeTBC")}</p>
              </div>
            ) : null}
            {order.deliveryMethod === "third_party" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                {order.deliveryProvider ? <p>{t("orders.provider")}: {order.deliveryProvider}</p> : null}
                {order.deliveryAddress ? <p>{t("orders.deliveryAddress")}: {order.deliveryAddress}</p> : null}
                {order.deliveryCity ? <p>{t("orders.city")}: {order.deliveryCity}</p> : null}
                <p>{t("orders.deliveryFee")}: {order.deliveryFee && order.deliveryFee > 0 ? formatIDR(order.deliveryFee) : t("orders.feeTBC")}</p>
              </div>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.payment")}</h2>
            <p className="mt-3 text-sm text-navy">{paymentLabel(t, order.paymentMethod)}</p>
            <p className="mt-2 text-sm text-navy-muted">{t("orders.status")}: {paymentStatusText(t, order.paymentStatus)}</p>
            <p className="mt-1 text-xs text-navy-muted">{t("orders.paymentPendingNote")}</p>
          </section>

          <OrderReviewSection order={currentOrder} buyerId={currentUser.id} />

          <p className="mt-4 text-sm text-navy-muted">{t("orders.placedAt", { date: formatOrderDate(order.createdAt) })}</p>
          {chatNote ? (
            <p className="mt-3 text-sm text-navy" role="status">
              {chatNote}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/orders")}>{t("orders.viewMy")}</Button>
            <Button variant="secondary" onClick={() => navigate("/browse")}>
              {t("orders.continueBrowsing")}
            </Button>
            <Button variant="secondary" onClick={handleChatSeller}>
              {t("listing.chatSeller")}
            </Button>
          </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-navy" : "text-navy-muted"}>{label}</dt>
      <dd className={strong ? "font-semibold text-navy" : "font-medium text-navy"}>{value}</dd>
    </div>
  )
}
