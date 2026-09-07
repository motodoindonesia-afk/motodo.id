/**
 * Order identity contract (web + mobile).
 * - Order.id = orders.id (UUID)
 * - Order.orderNumber = orders.order_number (MTD-XXXXXXXX, display + existing web URLs)
 * Lookups and RPCs accept either value (order_row_by_ref).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string) {
  return UUID_RE.test(value.trim())
}

export function generateOrderNumber() {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
  return `MTD-${raw}`
}

export type OrderIdentity = {
  id: string
  orderNumber: string
}

/** Web URL / display reference. Prefer order_number so existing /orders/MTD-… routes keep working. */
export function orderPublicRef(order: OrderIdentity) {
  return order.orderNumber || order.id
}

export function orderMatchesRef(order: OrderIdentity, ref: string) {
  return order.id === ref || order.orderNumber === ref
}
