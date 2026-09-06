import { cn } from "../../lib/cn"
import { useT } from "../../i18n"
import type { OrderStatus } from "../../types/order"
import type { MessageKey } from "../../i18n"

const STATUS_KEYS: Record<OrderStatus, MessageKey> = {
  pending: "orders.pending",
  confirmed: "orders.confirmed",
  completed: "orders.completed",
  cancelled: "orders.cancelled",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT()
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
      {t(STATUS_KEYS[status])}
    </span>
  )
}
