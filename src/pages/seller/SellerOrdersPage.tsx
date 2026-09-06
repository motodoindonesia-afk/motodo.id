import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { getSellerProfile } from "../../lib/seller"
import { SellerNav } from "../../components/seller/SellerNav"
import { formatIDR } from "../../lib/listingForm"
import { deliveryMethodLabel, formatOrderDate, getSellerOrders } from "../../lib/orders"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"

export function SellerOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useOrdersLive()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />

  const orders = getSellerOrders(user.id)

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Seller Orders</h1>
          <p className="mt-2 text-navy-muted">Review and confirm orders for your listings.</p>
          <SellerNav approved={profile.status === "approved"} />

          {orders.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-10 text-center">
              <p className="text-sm text-navy-muted">No orders yet.</p>
              <Button className="mt-4" onClick={() => navigate("/seller/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="rounded-2xl border border-line p-4 text-left"
                  onClick={() => navigate(`/seller/orders/${order.id}`)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">{order.id}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 font-medium text-navy">{order.listingName}</p>
                  <p className="mt-1 text-sm text-navy-muted">Buyer: {order.buyerName || "Buyer"}</p>
                  <p className="mt-2 text-sm text-navy">
                    Qty {order.quantity} · Buyer Total {formatIDR(order.buyerTotal)}
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Success Fee {formatIDR(order.sellerSuccessFeeAmount)} · Net {formatIDR(order.sellerNetAmount)}
                  </p>
                  <p className="mt-1 text-xs text-navy-muted">
                    {deliveryMethodLabel(order.deliveryMethod)} · {formatOrderDate(order.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}
