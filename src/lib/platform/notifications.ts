/**
 * Notification resource contract (web + mobile).
 * entity_type + entity_id is the platform identity.
 * link is a web-only SPA path helper and must not be required by native clients.
 */

export type NotificationEntityType = "conversation" | "order" | "listing" | "review" | "seller"

export type NotificationResource = {
  entityType: NotificationEntityType
  entityId: string
}

export type NotificationResourceInput = {
  relatedType?: NotificationEntityType
  relatedId?: string
  entityType?: NotificationEntityType
  entityId?: string
  link?: string
}

const ENTITY_TYPES: NotificationEntityType[] = ["conversation", "order", "listing", "review", "seller"]

function isEntityType(value: unknown): value is NotificationEntityType {
  return typeof value === "string" && (ENTITY_TYPES as string[]).includes(value)
}

/** Canonical resource. Ignores `link`. */
export function getNotificationResource(notification: NotificationResourceInput): NotificationResource | null {
  const entityType = notification.entityType ?? notification.relatedType
  const entityId = notification.entityId ?? notification.relatedId
  if (!isEntityType(entityType) || !entityId) return null
  return { entityType, entityId }
}
