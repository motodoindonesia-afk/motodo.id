import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { startBuyerConversation } from "../lib/chat"
import { formatIDR } from "../lib/listingForm"
import { getListingPickupDetails } from "../lib/listings"
import {
  catalogFromOrder,
  canBuyerViewOrder,
  deliveryFeeLabel,
  deliveryMethodLabel,
  formatOrderDate,
  getOrderById,
  paymentMethodLabel,
  paymentStatusLabel,
} from "../lib/orders"
import { OrderReviewSection } from "../components/reviews/OrderReviewSection"
import { useOrdersLive } from "../lib/useOrdersLive"
import { useReviewsLive } from "../lib/useReviewsLive"
import { useEffect, useState } from "react"

export function OrderDetailPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Loading order…</h1>
        </Container>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Order not found.</h1>
          <Button className="mt-8" onClick={() => navigate("/orders")}>
            View My Orders
          </Button>
        </Container>
      </main>
    )
  }

  if (!canBuyerViewOrder(order, user.id)) {
    return (
      <main className="bg-white py-16 sm:py-20">
        <Container className="max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy">You don't have permission to view this order.</h1>
          <Button className="mt-8" onClick={() => navigate("/orders")}>
            View My Orders
          </Button>
        </Container>
      </main>
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
        started.error === "self" ? "You cannot chat with yourself about your own listing." : "This listing is no longer available.",
      )
      return
    }
    navigate(`/messages/${started.conversation.id}`)
  }

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            {placed ? "Order Placed Successfully" : "Order Details"}
          </h1>
          <p className="mt-2 text-sm text-navy-muted">
            Order Number: <span className="font-medium text-navy">{order.id}</span>
          </p>
          <div className="mt-3">
            <OrderStatusBadge status={order.status} />
          </div>

          <section className="mt-8 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Motorcycle</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="h-40 w-full overflow-hidden rounded-xl bg-surface sm:h-28 sm:w-40 sm:shrink-0">
                {order.listingImage ? (
                  <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-navy">{order.listingName}</p>
                <p className="mt-2 text-sm text-navy-muted">Quantity: {order.quantity}</p>
                <p className="mt-1 text-sm text-navy-muted">Unit Price: {formatIDR(order.unitPrice)}</p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Price Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatIDR(order.subtotal)} />
              <Row label="Discount" value={formatIDR(order.discountAmount)} />
              <Row label="Total" value={formatIDR(order.buyerTotal)} strong />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Delivery</h2>
            <p className="mt-3 text-sm font-medium text-navy">{deliveryMethodLabel(order.deliveryMethod)}</p>
            {order.deliveryMethod === "pickup" ? (
              <div className="mt-3 text-sm text-navy-muted">
                <p>{pickup.businessName || "Seller showroom"}</p>
                <p className="mt-1">
                  {pickup.address ? `${pickup.address}, ` : ""}
                  {pickup.city || pickup.location}
                </p>
                <p className="mt-2">Delivery Fee: Not applicable</p>
              </div>
            ) : null}
            {order.deliveryMethod === "seller_fleet" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                <p>Delivery Address: {order.deliveryAddress || "—"}</p>
                <p>City: {order.deliveryCity || "—"}</p>
                {order.deliveryNotes ? <p>Delivery Notes: {order.deliveryNotes}</p> : null}
                <p>Delivery Fee: To be confirmed</p>
              </div>
            ) : null}
            {order.deliveryMethod === "third_party" ? (
              <div className="mt-3 space-y-1 text-sm text-navy-muted">
                {order.deliveryProvider ? <p>Provider: {order.deliveryProvider}</p> : null}
                {order.deliveryAddress ? <p>Delivery Address: {order.deliveryAddress}</p> : null}
                {order.deliveryCity ? <p>City: {order.deliveryCity}</p> : null}
                <p>Delivery Fee: {deliveryFeeLabel(order)}</p>
              </div>
            ) : null}
          </section>

          <section className="mt-4 rounded-2xl border border-line px-5 py-6 sm:px-6">
            <h2 className="text-lg font-bold text-navy">Payment</h2>
            <p className="mt-3 text-sm text-navy">{paymentMethodLabel(order.paymentMethod)}</p>
            <p className="mt-2 text-sm text-navy-muted">Status: {paymentStatusLabel(order.paymentStatus)}</p>
            <p className="mt-1 text-xs text-navy-muted">Payment processing will be available in a future release.</p>
          </section>

          <OrderReviewSection order={currentOrder} buyerId={currentUser.id} />

          <p className="mt-4 text-sm text-navy-muted">Placed {formatOrderDate(order.createdAt)}</p>
          {chatNote ? (
            <p className="mt-3 text-sm text-navy" role="status">
              {chatNote}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate("/orders")}>View My Orders</Button>
            <Button variant="secondary" onClick={() => navigate("/browse")}>
              Continue Browsing
            </Button>
            <Button variant="secondary" onClick={handleChatSeller}>
              Chat Seller
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
      <dd className={strong ? "font-semibold text-navy" : "font-medium text-navy"}>{value}</dd>
    </div>
  )
}
