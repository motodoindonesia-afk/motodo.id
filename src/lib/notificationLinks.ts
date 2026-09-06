import { getConversation } from "./chat"
import { getOrderById } from "./orders"
import { MOCK_ADMIN_USER_ID } from "./admin"
import type { Notification } from "./notifications"

export function getNotificationHref(notification: Notification, viewerId: string): string | null {
  if (notification.link) return notification.link

  const id = notification.relatedId
  if (!id) return null

  if (notification.relatedType === "conversation") {
    const conversation = getConversation(id)
    if (conversation?.sellerId === viewerId) return `/seller/messages/${id}`
    return `/messages/${id}`
  }

  if (notification.relatedType === "order") {
    const order = getOrderById(id)
    if (notification.type === "new_order" && order?.sellerId === viewerId) return `/seller/orders/${id}`
    if (notification.type === "review_reminder") return `/orders/${id}#review`
    return `/orders/${id}`
  }

  if (notification.relatedType === "listing") {
    return `/seller/listings/${id}`
  }

  if (notification.relatedType === "seller") {
    if (viewerId === MOCK_ADMIN_USER_ID) return `/admin/sellers/${id}`
    return "/seller/dashboard"
  }
  if (notification.relatedType === "review") return `/orders/${id}#review`
  return null
}
