export type NotificationType =
  | "new_message"
  | "new_order"
  | "order_confirmed"
  | "order_completed"
  | "order_cancelled"
  | "listing_sold"
  | "listing_low_inventory"
  | "listing_status"
  | "review_reminder"
  | "seller_registration"
  | "seller_approved"
  | "seller_rejected"

export type NotificationRelatedType = "conversation" | "order" | "listing" | "review" | "seller"

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  /** Platform resource id (notifications.entity_id). */
  relatedId?: string
  /** Platform resource type (notifications.entity_type). */
  relatedType?: NotificationRelatedType
  /** Web SPA path only. Native clients must use relatedType + relatedId. */
  link?: string
  read: boolean
  createdAt: string
  readAt?: string
}

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  relatedType?: NotificationRelatedType
  unique?: boolean
}
