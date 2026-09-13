import { Link, useNavigate, useParams } from "react-router-dom"
import { useState } from "react"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { CancelOrderModal } from "../../components/admin/CancelOrderModal"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { formatMoney, sellerBusinessName } from "../../lib/adminPlatform"
import { formatIDR } from "../../lib/listingForm"
import {
  adminCancelOrder,
  deliveryFeeLabel,
  deliveryMethodLabel,
  formatOrderDate,
  getOrderById,
  OrderError,
  orderPublicRef,
  paymentMethodLabel,
  SELLER_SUCCESS_FEE_RATE,
} from "../../lib/orders"
import { isAdminCancellableOrderStatus } from "../../lib/platform/orderAdmin"
import { userFacingMessage } from "../../lib/userFacingError"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import type { ReactNode } from "react"

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-navy-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy sm:text-right">{value ?? "—"}</dd>
    </div>
  )
}

export function AdminOrderDetailPage() {
  const { orderId, id } = useParams()
  const orderIdResolved = orderId ?? id
  const navigate = useNavigate()
  useOrdersLive()
  useSellerLive()
  const order = orderIdResolved ? getOrderById(orderIdResolved) : null
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState("")
  const [cancelError, setCancelError] = useState("")

  if (!order) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-navy">Order not found</h1>
          <Button className="mt-6" onClick={() => navigate("/orders")}>
            Back to orders
          </Button>
        </Container>
      </main>
    )
  }

  const currentOrder = order
  const cancellable = isAdminCancellableOrderStatus(currentOrder.status)
  const publicRef = orderPublicRef(currentOrder)

  async function handleConfirmCancel() {
    if (cancelling) return
    setCancelError("")
    setCancelling(true)
    try {
      await adminCancelOrder(publicRef)
      setConfirmOpen(false)
      setMessage("Order cancelled successfully.")
    } catch (error) {
      setCancelError(
        error instanceof OrderError || error instanceof Error
          ? userFacingMessage(error, "Unable to cancel order.")
          : "Unable to cancel order.",
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <p className="mt-6 text-sm">
            <Link to="/orders" className="font-medium text-brand hover:text-brand-hover">
              ← Orders
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-navy">Order {orderPublicRef(order)}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-navy-muted">
            Admins can cancel pending or confirmed orders. Other order status changes follow the existing order workflow.
          </p>
          {message ? (
            <p className="mt-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-navy" role="status">
              {message}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4">
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Order Information</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Order ID" value={<span className="font-mono text-xs">{orderPublicRef(order)}</span>} />
                <Row label="Created Date" value={formatOrderDate(order.createdAt)} />
                <Row label="Updated Date" value={formatOrderDate(order.updatedAt)} />
                <Row label="Status" value={<OrderStatusBadge status={order.status} />} />
              </dl>
              <ol className="mt-6 grid gap-2 sm:grid-cols-4" aria-hidden="true">
                {(["pending", "confirmed", "completed", "cancelled"] as const).map((step) => {
                  const active = order.status === step
                  return (
                    <li
                      key={step}
                      className={`pointer-events-none select-none rounded-lg border px-3 py-2 text-center text-xs font-medium capitalize ${
                        active ? "border-brand bg-brand/10 text-brand" : "border-line text-navy-muted"
                      }`}
                    >
                      {step}
                    </li>
                  )
                })}
              </ol>
              {cancellable ? (
                <div className="mt-6 border-t border-line pt-5">
                  <h4 className="text-sm font-semibold text-navy">Admin Actions</h4>
                  <p className="mt-1 text-sm text-navy-muted">
                    Admins can cancel pending or confirmed orders. Other order status changes follow the existing order
                    workflow.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 min-h-11 border-red-200 bg-white px-4 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setCancelError("")
                      setConfirmOpen(true)
                    }}
                  >
                    Cancel Order
                  </Button>
                </div>
              ) : (
                <p className="mt-6 border-t border-line pt-5 text-sm text-navy-muted">
                  Admins can cancel pending or confirmed orders. Other order status changes follow the existing order
                  workflow.
                </p>
              )}
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Buyer</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Name" value={order.buyerName} />
                <Row label="Email" value={order.buyerEmail} />
                <Row label="Phone" value={order.buyerPhone} />
              </dl>
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Seller</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Business Name" value={sellerBusinessName(order.sellerId)} />
              </dl>
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Motorcycle</h3>
              <dl className="mt-4 space-y-3">
                <Row
                  label="Name"
                  value={
                    <Link to={`/listings/${order.listingId}`} className="text-brand hover:text-brand-hover">
                      {order.listingName}
                    </Link>
                  }
                />
                <Row label="Price" value={formatIDR(order.unitPrice)} />
                <Row label="Quantity" value={order.quantity} />
              </dl>
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Financial</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Unit Price" value={formatMoney(order.unitPrice)} />
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                <Row label="Discount" value={formatMoney(order.discountAmount)} />
                <Row label="Buyer Total" value={formatMoney(order.buyerTotal)} />
                <Row label={`Seller Success Fee (${feePercent}%)`} value={formatMoney(order.sellerSuccessFeeAmount)} />
                <Row label="Seller Net Amount" value={formatMoney(order.sellerNetAmount)} />
              </dl>
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Delivery</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Method" value={deliveryMethodLabel(order.deliveryMethod)} />
                {order.deliveryMethod === "third_party" ? <Row label="Third-Party Logistics" value="Coming Soon" /> : null}
                {order.deliveryMethod === "seller_fleet" ? (
                  <>
                    <Row label="Delivery Address" value={order.deliveryAddress} />
                    <Row label="City" value={order.deliveryCity} />
                    <Row label="Notes" value={order.deliveryNotes} />
                    <Row label="Delivery fee" value={deliveryFeeLabel(order)} />
                  </>
                ) : null}
              </dl>
            </section>
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Payment</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Payment Method" value={paymentMethodLabel(order.paymentMethod)} />
                <Row label="Payment Status" value={order.paymentStatus ?? "pending"} />
              </dl>
              <p className="mt-3 text-xs text-navy-muted">Payment remains mock until a payment gateway is connected.</p>
            </section>
          </div>
        </div>
      </Container>
      {confirmOpen ? (
        <CancelOrderModal
          orderRef={publicRef}
          loading={cancelling}
          error={cancelError}
          onKeep={() => {
            if (cancelling) return
            setConfirmOpen(false)
            setCancelError("")
          }}
          onConfirm={() => void handleConfirmCancel()}
        />
      ) : null}
    </main>
  )
}
