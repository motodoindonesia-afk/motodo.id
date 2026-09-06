import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { getSellerProfile } from "../../lib/seller"
import { SellerNav } from "../../components/seller/SellerNav"
import { formatIDR } from "../../lib/listingForm"
import { formatOrderDate, getSellerOrders } from "../../lib/orders"
import { useT, type Translate } from "../../i18n"
import type { DeliveryMethod } from "../../types/order"

function deliveryLabel(t: Translate, method: DeliveryMethod) {
  if (method === "pickup") return t("orders.pickupShowroom")
  if (method === "seller_fleet") return t("orders.sellerFleet")
  return t("orders.thirdParty")
}
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"

export function SellerOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useSellerLive()
  useOrdersLive()
  const t = useT()

  if (!user) return null
  const profile = getSellerProfile(user.id)
  if (!profile) return <Navigate to="/seller/register" replace />

  const orders = getSellerOrders(user.id)

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">{t("seller.ordersTitle")}</h1>
          <p className="mt-2 text-navy-muted">{t("seller.ordersBody")}</p>
          <SellerNav approved={profile.status === "approved"} />

          {orders.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line px-5 py-10 text-center">
              <p className="text-sm text-navy-muted">{t("orders.empty")}</p>
              <Button className="mt-4" onClick={() => navigate("/seller/dashboard")}>
                {t("seller.backDashboard")}
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
                  <p className="mt-1 text-sm text-navy-muted">{t("orders.buyer")}: {order.buyerName || t("orders.buyer")}</p>
                  <p className="mt-2 text-sm text-navy">
                    {t("orders.qtyShort", { count: order.quantity, amount: formatIDR(order.buyerTotal) })}
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">
                    {t("orders.feeNet", { fee: formatIDR(order.sellerSuccessFeeAmount), net: formatIDR(order.sellerNetAmount) })}
                  </p>
                  <p className="mt-1 text-xs text-navy-muted">
                    {deliveryLabel(t, order.deliveryMethod)} · {formatOrderDate(order.createdAt)}
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
