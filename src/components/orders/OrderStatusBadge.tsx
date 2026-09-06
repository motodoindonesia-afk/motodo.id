import { cn } from "../../lib/cn"
import { orderStatusLabel } from "../../lib/orders"
import type { OrderStatus } from "../../types/order"

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "pending" && "bg-surface text-navy",
        status === "confirmed" && "bg-surface text-brand",
        status === "completed" && "bg-surface text-navy",
        status === "cancelled" && "bg-surface text-navy-muted",
      )}
    >
      {orderStatusLabel(status)}
    </span>
  )
}
