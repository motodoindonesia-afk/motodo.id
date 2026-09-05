import type { SellerStatus } from "../../types/seller"
import { statusLabel } from "../../lib/seller"
import { cn } from "../../lib/cn"

export function SellerStatusBadge({ status, label }: { status: SellerStatus; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "approved" && "bg-surface text-brand",
        status === "pending" && "bg-surface text-navy",
        status === "rejected" && "bg-red-50 text-red-700",
      )}
    >
      {label ?? statusLabel(status)}
    </span>
  )
}
