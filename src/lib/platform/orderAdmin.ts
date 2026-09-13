import type { OrderStatus } from "../../types/order"

/** Statuses an admin may cancel. Matches admin_cancel_order(). Buyer/seller cancel_order remains pending-only. */
export function isAdminCancellableOrderStatus(status: OrderStatus) {
  return status === "pending" || status === "confirmed"
}
