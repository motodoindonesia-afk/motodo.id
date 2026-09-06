import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge"
import { Button } from "../components/ui/Button"
import { Container } from "../components/layout/Container"
import { formatIDR } from "../lib/listingForm"
import { deliveryMethodLabel, formatOrderDate, getBuyerOrders } from "../lib/orders"
import { getReviewByOrderId } from "../lib/reviews"
import { useOrdersLive } from "../lib/useOrdersLive"
import { useReviewsLive } from "../lib/useReviewsLive"
import { StarRating } from "../components/reviews/StarRating"

export function OrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useOrdersLive()
  useReviewsLive()
  const orders = user ? getBuyerOrders(user.id) : []
  const hasCompleted = orders.some((order) => order.status === "completed")

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">My Orders</h1>
          <p className="mt-2 text-navy-muted">Track motorcycles you have ordered on Motodo.</p>

          {orders.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-10 text-center">
              <p className="text-sm text-navy-muted">No orders yet.</p>
              <p className="mt-2 text-sm text-navy-muted">You can review a motorcycle after your order is completed.</p>
              <Button className="mt-4" onClick={() => navigate("/browse")}>
                Browse Motorcycles
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {!hasCompleted ? (
                <p className="text-sm text-navy-muted">You can review a motorcycle after your order is completed.</p>
              ) : null}
              {orders.map((order) => {
                const review = getReviewByOrderId(order.id)
                const reviewed = Boolean(review)
                return (
                <button
                  key={order.id}
                  type="button"
                  className="flex flex-col gap-4 rounded-2xl border border-line p-4 text-left sm:flex-row sm:items-center"
                  onClick={() =>
                    navigate(order.status === "completed" ? `/orders/${order.id}#review` : `/orders/${order.id}`)
                  }
                >
                  <div className="h-36 w-full overflow-hidden rounded-xl bg-surface sm:h-24 sm:w-36 sm:shrink-0">
                    {order.listingImage ? (
                      <img src={order.listingImage} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy">{order.listingName}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-navy-muted">{order.id}</p>
                    <p className="mt-2 text-sm text-navy">
                      Quantity {order.quantity} · {formatIDR(order.buyerTotal)}
                    </p>
                    <p className="mt-1 text-xs text-navy-muted">
                      {deliveryMethodLabel(order.deliveryMethod)} · {formatOrderDate(order.createdAt)}
                    </p>
                    {order.status === "completed" ? (
                      reviewed ? (
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-navy">
                          Reviewed <StarRating value={review?.rating ?? 0} readOnly size="sm" />
                        </p>
                      ) : (
                        <p className="mt-2 text-sm font-medium text-brand">Rate Purchase</p>
                      )
                    ) : null}
                  </div>
                </button>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}
