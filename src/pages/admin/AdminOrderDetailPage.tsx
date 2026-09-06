import { Link, useNavigate, useParams } from "react-router-dom"
import { AdminNav } from "../../components/admin/AdminNav"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { formatMoney, sellerBusinessName } from "../../lib/adminPlatform"
import { formatIDR } from "../../lib/listingForm"
import {
  deliveryFeeLabel,
  deliveryMethodLabel,
  formatOrderDate,
  getOrderById,
  paymentMethodLabel,
  SELLER_SUCCESS_FEE_RATE,
} from "../../lib/orders"
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
  const { orderId } = useParams()
  const navigate = useNavigate()
  useOrdersLive()
  useSellerLive()
  const order = orderId ? getOrderById(orderId) : null
  const feePercent = Math.round(SELLER_SUCCESS_FEE_RATE * 100)

  if (!order) {
    return (
      <main className="bg-white py-10 sm:py-14">
        <Container className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-navy">Order not found</h1>
          <Button className="mt-6" onClick={() => navigate("/admin/orders")}>
            Back to orders
          </Button>
        </Container>
      </main>
    )
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Admin</h1>
          <AdminNav />
          <p className="mt-6 text-sm">
            <Link to="/admin/orders" className="font-medium text-brand hover:text-brand-hover">
              ← Orders
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-navy">Order {order.id.slice(0, 8)}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 text-sm text-navy-muted">Admin can view this order. Sellers update status from Seller Orders.</p>

          <div className="mt-8 grid gap-4">
            <section className="rounded-2xl border border-line px-5 py-6">
              <h3 className="text-lg font-bold text-navy">Order Information</h3>
              <dl className="mt-4 space-y-3">
                <Row label="Order ID" value={<span className="font-mono text-xs">{order.id}</span>} />
                <Row label="Created Date" value={formatOrderDate(order.createdAt)} />
                <Row label="Updated Date" value={formatOrderDate(order.updatedAt)} />
                <Row label="Status" value={<OrderStatusBadge status={order.status} />} />
              </dl>
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
                    <Link to={`/admin/listings/${order.listingId}`} className="text-brand hover:text-brand-hover">
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
            </section>
          </div>
        </div>
      </Container>
    </main>
  )
}
