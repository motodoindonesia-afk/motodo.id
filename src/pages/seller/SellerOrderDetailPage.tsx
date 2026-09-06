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
  deliveryFeeLabel,
  deliveryMethodLabel,
  formatOrderDate,
  getOrderById,
  OrderError,
  paymentMethodLabel,
  paymentStatusLabel,
  SELLER_SUCCESS_FEE_RATE,
  updateSellerOrderStatus,
} from "../../lib/orders"
import { getSellerProfile } from "../../lib/seller"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import type { OrderStatus } from "../../types/order"

export function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useOrdersLive()
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
          <h1 className="text-3xl font-bold tracking-tight text-navy">Order not found.</h1>
          <Button className="mt-8" onClick={() => navigate("/seller/orders")}>
            Back to Orders
          </Button>
        </Container>
      </main>
    )
  }

  if (!canSellerViewOrder(order, user.id)) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">You don't have permission to view this order.</h1>
          <Button className="mt-8" onClick={() => navigate("/seller/orders")}>
            Back to Orders
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
      setError(err instanceof OrderError || err instanceof Error ? err.message : "Unable to update order.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Order Information</h1>
          <div className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <dl className="space-y-2 text-sm">
              <Row label="Order ID" value={order.id} />
              <Row label="Date" value={formatOrderDate(order.createdAt)} />
              <div className="flex justify-between gap-4">
                <dt className="text-navy-muted">Status</dt>
                <dd>
                  <OrderStatusBadge status={order.status} />
                </dd>
              </div>
            </dl>
          </div>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Buyer Information</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Buyer Name" value={order.buyerName || "—"} />
              <Row label="Buyer Email" value={order.buyerEmail || "—"} />
              <Row label="Buyer Phone" value={order.buyerPhone || "—"} />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Motorcycle</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="h-32 w-full overflow-hidden rounded-xl bg-surface sm:h-24 sm:w-32 sm:shrink-0">
                {order.listingImage ? (
                  <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Motorcycle Name" value={order.listingName} />
                <Row label="Quantity" value={String(order.quantity)} />
                <Row label="Unit Price" value={formatIDR(order.unitPrice)} />
              </dl>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Transaction Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Unit Price" value={formatIDR(order.unitPrice)} />
              <Row label="Quantity" value={String(order.quantity)} />
              <Row label="Subtotal" value={formatIDR(order.subtotal)} />
              <Row label="Discount" value={formatIDR(order.discountAmount)} />
              <Row label="Buyer Total" value={formatIDR(order.buyerTotal)} />
            </dl>
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="text-sm font-semibold text-navy">Seller Fees</h3>
              <p className="mt-2 text-sm text-navy-muted">Motodo charges a {feePercent}% success fee per transaction.</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Success Fee Rate" value={`${feePercent}%`} />
                <Row label="Success Fee" value={`-${formatIDR(order.sellerSuccessFeeAmount)}`} />
              </dl>
            </div>
            <div className="mt-5 border-t border-line pt-5">
              <Row label="Seller Net Amount" value={formatIDR(order.sellerNetAmount)} strong />
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Delivery</h2>
            <p className="mt-3 text-sm font-medium text-navy">{deliveryMethodLabel(order.deliveryMethod)}</p>
            {order.deliveryMethod === "pickup" ? (
              <div className="mt-3 text-sm text-navy-muted">
                <p>{pickup.businessName || profile.businessName}</p>
                <p className="mt-1">
                  {pickup.address || profile.showroomAddress}
                  {pickup.city || profile.city ? `, ${pickup.city || profile.city}` : ""}
                </p>
                <p className="mt-2">Delivery Fee: Not applicable</p>
              </div>
            ) : null}
            {order.deliveryMethod === "seller_fleet" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                <p>Delivery is provided directly by the seller.</p>
                <p>Delivery Address: {order.deliveryAddress || "—"}</p>
                <p>City: {order.deliveryCity || "—"}</p>
                {order.deliveryNotes ? <p>Delivery Notes: {order.deliveryNotes}</p> : null}
                <p>Delivery Fee: To be confirmed with seller</p>
              </div>
            ) : null}
            {order.deliveryMethod === "third_party" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                {order.deliveryProvider ? <p>Provider: {order.deliveryProvider}</p> : null}
                {order.deliveryAddress ? <p>Delivery Address: {order.deliveryAddress}</p> : null}
                {order.deliveryCity ? <p>City: {order.deliveryCity}</p> : null}
                {order.deliveryNotes ? <p>Notes: {order.deliveryNotes}</p> : null}
                <p>Delivery Fee: {deliveryFeeLabel(order)}</p>
              </div>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Payment</h2>
            <p className="mt-3 text-sm text-navy">{paymentMethodLabel(order.paymentMethod)}</p>
            <p className="mt-2 text-sm text-navy-muted">Status: {paymentStatusLabel(order.paymentStatus)}</p>
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
                  Confirm Order
                </Button>
                <Button variant="secondary" disabled={updating} onClick={() => handleStatus("cancelled")}>
                  Cancel Order
                </Button>
              </>
            ) : null}
            {order.status === "confirmed" ? (
              <Button disabled={updating} onClick={() => handleStatus("completed")}>
                Mark Completed
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => navigate("/seller/orders")}>
              Back to Orders
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
