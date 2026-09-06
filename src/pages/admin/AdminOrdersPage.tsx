import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { OrderStatusBadge } from "../../components/orders/OrderStatusBadge"
import { AuthInput } from "../../components/auth/AuthField"
import { Button } from "../../components/ui/Button"
import { Container } from "../../components/layout/Container"
import { cn } from "../../lib/cn"
import { formatMoney, getAllOrders, sellerBusinessName } from "../../lib/adminPlatform"
import { deliveryMethodLabel, formatOrderDate } from "../../lib/orders"
import { useOrdersLive } from "../../lib/useOrdersLive"
import { useSellerLive } from "../../lib/useSellerLive"
import type { OrderStatus } from "../../types/order"

const FILTERS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
]

export function AdminOrdersPage() {
  useOrdersLive()
  useSellerLive()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>(
    FILTERS.some((item) => item.id === statusParam) ? (statusParam as OrderStatus) : "all",
  )
  const [query, setQuery] = useState("")
  const orders = getAllOrders()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false
      if (!needle) return true
      return [order.id, order.listingName, order.buyerName, sellerBusinessName(order.sellerId)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [orders, status, query])

  return (
    <main className="bg-white py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Orders</h1>
          <p className="mt-2 text-navy-muted">Monitor marketplace transactions. Sellers remain responsible for status changes.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  status === item.id ? "bg-brand text-white" : "bg-surface text-navy hover:text-brand",
                )}
                onClick={() => setStatus(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-md">
            <AuthInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order ID, motorcycle, buyer, or seller"
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-navy-muted">No orders match this filter.</p>
            ) : (
              <table className="w-full min-w-[960px] text-left">
                <thead className="bg-surface">
                  <tr className="text-xs font-medium uppercase tracking-wide text-navy-muted">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Motorcycle</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Buyer Total</th>
                    <th className="px-4 py-3">Success Fee</th>
                    <th className="px-4 py-3">Seller Net</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id} className="border-t border-line">
                      <td className="px-4 py-3 font-mono text-xs text-navy">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm text-navy">{order.listingName}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{order.buyerName}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{sellerBusinessName(order.sellerId)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{order.quantity}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatMoney(order.buyerTotal)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatMoney(order.sellerSuccessFeeAmount)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatMoney(order.sellerNetAmount)}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{deliveryMethodLabel(order.deliveryMethod)}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{order.paymentStatus ?? "pending"}</td>
                      <td className="px-4 py-3 text-sm text-navy-muted">{formatOrderDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="secondary" onClick={() => navigate(`/orders/${order.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Container>
    </main>
  )
}
