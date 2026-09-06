import type { Notification, NotificationRelatedType, NotificationType } from "../types/notification"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

const NOTIFICATIONS_UPDATED_EVENT = "motodo:notifications-updated"

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

const TYPES: NotificationType[] = [
  "new_message",
  "new_order",
  "order_confirmed",
  "order_completed",
  "order_cancelled",
  "listing_sold",
  "listing_low_inventory",
  "listing_status",
  "review_reminder",
  "seller_registration",
  "seller_approved",
  "seller_rejected",
]

const RELATED: NotificationRelatedType[] = ["conversation", "order", "listing", "review", "seller"]

const notificationCache = new Map<string, Notification>()
let hydrated = false

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
  }
}

export function isNotificationsHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setNotificationsHydrated(value: boolean) {
  hydrated = value
  notifyUpdated()
}

export function clearNotificationCache() {
  notificationCache.clear()
  hydrated = false
  notifyUpdated()
}

export function peekCachedNotifications(): Notification[] {
  return [...notificationCache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function isType(value: string): value is NotificationType {
  return (TYPES as string[]).includes(value)
}

function isRelated(value: string): value is NotificationRelatedType {
  return (RELATED as string[]).includes(value)
}

export function mapNotificationRow(row: NotificationRow): Notification | null {
  if (!isType(row.type)) return null
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.body,
    relatedId: row.entity_id ?? undefined,
    relatedType: row.entity_type && isRelated(row.entity_type) ? row.entity_type : undefined,
    link: row.link ?? undefined,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  }
}

function remember(notification: Notification) {
  notificationCache.set(notification.id, notification)
  notifyUpdated()
}

function asRow(data: unknown): NotificationRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as NotificationRow
}

function asRows(data: unknown): NotificationRow[] {
  return Array.isArray(data) ? (data as NotificationRow[]) : []
}

export async function getMyNotifications(): Promise<Notification[]> {
  await hydrateNotifications()
  return peekCachedNotifications()
}

export function getUnreadNotificationCount(): number {
  return peekCachedNotifications().filter((item) => !item.read).length
}

export async function hydrateNotifications() {
  const client = getSupabaseClient()
  const { data, error } = await client.from("notifications").select("*").order("created_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load notifications.")
  notificationCache.clear()
  for (const row of asRows(data)) {
    const item = mapNotificationRow(row)
    if (item) notificationCache.set(item.id, item)
  }
  hydrated = true
  notifyUpdated()
}

export async function markNotificationReadRemote(id: string): Promise<Notification | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("mark_notification_read", { p_notification_id: id })
  if (error) throwUserFacing(error, "Unable to load notifications.")
  const row = asRow(data) ?? asRows(data)[0]
  if (!row) return null
  const item = mapNotificationRow(row)
  if (item) remember(item)
  return item
}

export async function markNotificationUnreadRemote(id: string): Promise<Notification | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("mark_notification_unread", { p_notification_id: id })
  if (error) throwUserFacing(error, "Unable to load notifications.")
  const row = asRow(data) ?? asRows(data)[0]
  if (!row) return null
  const item = mapNotificationRow(row)
  if (item) remember(item)
  return item
}

export async function markAllNotificationsReadRemote() {
  const client = getSupabaseClient()
  const { error } = await client.rpc("mark_all_notifications_read")
  if (error) throwUserFacing(error, "Unable to load notifications.")
  for (const item of notificationCache.values()) {
    if (!item.read) {
      notificationCache.set(item.id, { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() })
    }
  }
  notifyUpdated()
}

export function subscribeToNotifications(userId: string) {
  const client = getSupabaseClient()
  const channel = client
    .channel(`notifications-user-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const item = mapNotificationRow(payload.new as NotificationRow)
        if (item) remember(item)
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const item = mapNotificationRow(payload.new as NotificationRow)
        if (item) remember(item)
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export const markNotificationRead = markNotificationReadRemote
export const markAllNotificationsRead = markAllNotificationsReadRemote
