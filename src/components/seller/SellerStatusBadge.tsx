import type { SellerStatus } from "../../types/seller"
import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

export function SellerStatusBadge({ status, label }: { status: SellerStatus; label?: string }) {
  const t = useT()
  const fallback =
    status === "approved" ? t("status.approved") : status === "rejected" ? t("status.rejected") : t("seller.pendingVerify")
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "approved" && "bg-surface text-brand",
        status === "pending" && "bg-surface text-navy",
        status === "rejected" && "bg-red-50 text-red-700",
      )}
    >
      {label ?? fallback}
    </span>
  )
}
