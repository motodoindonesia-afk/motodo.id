import { getConversation } from "./chat"
import { getOrderById, orderPublicRef } from "./orders"
import { MOCK_ADMIN_USER_ID } from "./admin"
import { getNotificationResource } from "./platform/notifications"
import type { Notification } from "./notifications"

/**
 * Web SPA href. Native clients should use getNotificationResource (entity_type + entity_id).
 * `notification.link` is a web-only fallback.
 */
export function getNotificationHref(notification: Notification, viewerId: string): string | null {
  const resource = getNotificationResource(notification)
  if (resource) {
    if (resource.entityType === "conversation") {
      const conversation = getConversation(resource.entityId)
      if (conversation?.sellerId === viewerId) return `/seller/messages/${resource.entityId}`
      return `/messages/${resource.entityId}`
    }
    if (resource.entityType === "order") {
      const order = getOrderById(resource.entityId)
      const orderRef = order ? orderPublicRef(order) : resource.entityId
      if (notification.type === "new_order" && order?.sellerId === viewerId) return `/seller/orders/${orderRef}`
      if (notification.type === "review_reminder") return `/orders/${orderRef}#review`
      return `/orders/${orderRef}`
    }
    if (resource.entityType === "listing") {
      return `/seller/listings/${resource.entityId}`
    }
    if (resource.entityType === "seller") {
      if (viewerId === MOCK_ADMIN_USER_ID) return `/admin/sellers/${resource.entityId}`
      return "/seller/dashboard"
    }
    if (resource.entityType === "review") {
      const order = getOrderById(resource.entityId)
      const orderRef = order ? orderPublicRef(order) : resource.entityId
      return `/orders/${orderRef}#review`
    }
  }

  if (notification.link) return notification.link
  return null
}
