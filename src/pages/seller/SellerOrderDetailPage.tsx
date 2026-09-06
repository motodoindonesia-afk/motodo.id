import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { formatIDR } from "../../lib/listingForm"
import { getListingPickupDetails } from "../../lib/listings"
import {
  canSellerViewOrder,
  formatOrderDate,
  getOrderById,
  OrderError,
  SELLER_SUCCESS_FEE_RATE,
  updateSellerOrderStatus,
} from "../../lib/orders"
import { getSellerProfile } from "../../lib/seller"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import type { OrderStatus } from "../../types/order"
import { useLanguage, type Translate } from "../../i18n"
import type { DeliveryMethod, PaymentMethod, PaymentStatus } from "../../types/order"

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

export function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useOrdersLive()
  const { t, tm } = useLanguage()
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />

  const order = orderId ? getOrderById(orderId) : null
  if (!order) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("orders.notFound")}</h1>
          <Button className="mt-8" onClick={() => navigate("/seller/orders")}>
            {t("seller.backOrders")}
          </Button>
        </Container>
      </main>
    )
  }

  if (!canSellerViewOrder(order, user.id)) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("orders.noPermission")}</h1>
          <Button className="mt-8" onClick={() => navigate("/seller/orders")}>
            {t("seller.backOrders")}
          </Button>
        </Container>
      </main>
    )
  }

  const currentUser = user
  const currentOrder = order
  const pickup = getListingPickupDetails(currentOrder.listingId)
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)

  async function handleStatus(next: OrderStatus) {
    setError("")
    setUpdating(true)
    try {
      await updateSellerOrderStatus(currentOrder.id, currentUser.id, next)
    } catch (err) {
      setError(err instanceof OrderError || err instanceof Error ? tm(err.message, "seller.unableUpdate") : t("seller.unableUpdate"))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.orderInfo")}</h1>
          <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <dl className="space-y-2 text-sm">
              <Row label={t("seller.orderId")} value={order.id} />
              <Row label={t("seller.date")} value={formatOrderDate(order.createdAt)} />
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">{t("orders.status")}</dt>
                <dd>
                  <OrderStatusBadge status={order.status} />
                </dd>
              </div>
            </dl>
          </div>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("seller.buyerInfo")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("seller.buyerName")} value={order.buyerName || "—"} />
              <Row label={t("seller.buyerEmail")} value={order.buyerEmail || "—"} />
              <Row label={t("seller.buyerPhone")} value={order.buyerPhone || "—"} />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.motorcycle")}</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="h-32 w-full overflow-hidden rounded-xl bg-surface sm:h-24 sm:w-32 sm:shrink-0">
                {order.listingImage ? (
                  <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <dl className="space-y-2 text-sm">
                <Row label={t("seller.motorcycleName")} value={order.listingName} />
                <Row label={t("checkout.quantity")} value={String(order.quantity)} />
                <Row label={t("orders.unitPrice")} value={formatIDR(order.unitPrice)} />
              </dl>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("seller.transactionSummary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("orders.unitPrice")} value={formatIDR(order.unitPrice)} />
              <Row label={t("checkout.quantity")} value={String(order.quantity)} />
              <Row label={t("orders.subtotal")} value={formatIDR(order.subtotal)} />
              <Row label={t("orders.discount")} value={formatIDR(order.discountAmount)} />
              <Row label={t("orders.total")} value={formatIDR(order.buyerTotal)} />
            </dl>
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="text-sm font-semibold text-navy">{t("seller.sellerFees")}</h3>
              <p className="mt-2 text-sm text-navy-muted">{t("seller.feePercent", { percent: feePercent })}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label={t("seller.feeRate")} value={`${feePercent}%`} />
                <Row label={t("seller.successFee")} value={`-${formatIDR(order.sellerSuccessFeeAmount)}`} />
              </dl>
            </div>
            <div className="mt-5 border-t border-line pt-5">
              <Row label={t("seller.sellerNetAmount")} value={formatIDR(order.sellerNetAmount)} strong />
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.delivery")}</h2>
            <p className="mt-3 text-sm font-medium text-navy">{deliveryLabel(t, order.deliveryMethod)}</p>
            {order.deliveryMethod === "pickup" ? (
              <div className="mt-3 text-sm text-navy-muted">
                <p>{pickup.businessName || profile.businessName}</p>
                <p className="mt-1">
                  {pickup.address || profile.showroomAddress}
                  {pickup.city || profile.city ? `, ${pickup.city || profile.city}` : ""}
                </p>
                <p className="mt-2">{t("orders.deliveryFee")}: {t("orders.feeNA")}</p>
              </div>
            ) : null}
            {order.deliveryMethod === "seller_fleet" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                <p>{t("checkout.fleetDesc")}</p>
                <p>{t("orders.deliveryAddress")}: {order.deliveryAddress || "—"}</p>
                <p>{t("orders.city")}: {order.deliveryCity || "—"}</p>
                {order.deliveryNotes ? <p>{t("orders.deliveryNotes")}: {order.deliveryNotes}</p> : null}
                <p>{t("orders.deliveryFee")}: {t("orders.feeTBCSeller")}</p>
              </div>
            ) : null}
            {order.deliveryMethod === "third_party" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                {order.deliveryProvider ? <p>{t("orders.provider")}: {order.deliveryProvider}</p> : null}
                {order.deliveryAddress ? <p>{t("orders.deliveryAddress")}: {order.deliveryAddress}</p> : null}
                {order.deliveryCity ? <p>{t("orders.city")}: {order.deliveryCity}</p> : null}
                {order.deliveryNotes ? <p>{t("orders.notes")}: {order.deliveryNotes}</p> : null}
                <p>
                  {t("orders.deliveryFee")}:{" "}
                  {typeof order.deliveryFee === "number" && order.deliveryFee > 0
                    ? formatIDR(order.deliveryFee)
                    : t("orders.feeTBC")}
                </p>
              </div>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">{t("orders.payment")}</h2>
            <p className="mt-3 text-sm text-navy">{paymentLabel(t, order.paymentMethod)}</p>
            <p className="mt-2 text-sm text-navy-muted">
              {t("orders.status")}: {paymentStatusText(t, order.paymentStatus)}
            </p>
          </section>

          {error ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {order.status === "pending" ? (
              <>
                <Button disabled={updating} onClick={() => handleStatus("confirmed")}>
                  {t("seller.confirmOrder")}
                </Button>
                <Button variant="secondary" disabled={updating} onClick={() => handleStatus("cancelled")}>
                  {t("seller.cancelOrder")}
                </Button>
              </>
            ) : null}
            {order.status === "confirmed" ? (
              <Button disabled={updating} onClick={() => handleStatus("completed")}>
                {t("seller.markCompleted")}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => navigate("/seller/orders")}>
              {t("seller.backOrders")}
            </Button>
          </div>
        </div>
      </Container>
    </main>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-navy" : "text-navy-muted"}>{label}</dt>
      <dd className={strong ? "text-right font-semibold text-navy" : "text-right font-medium text-navy"}>{value}</dd>
    </div>
  )
}
