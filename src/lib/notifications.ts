import type {
  CreateNotificationInput,
  Notification,
  NotificationRelatedType,
  NotificationType,
} from "../types/notification"
import { isSupabaseConfigured } from "./supabase"
import {
  isNotificationsHydrated,
  markAllNotificationsReadRemote,
  markNotificationReadRemote,
  markNotificationUnreadRemote,
  peekCachedNotifications,
} from "./notificationsSupabase"

export type { Notification, NotificationType, NotificationRelatedType, CreateNotificationInput }

export const NOTIFICATIONS_STORAGE_KEY = "motodo_notifications"
export const NOTIFICATIONS_UPDATED_EVENT = "motodo:notifications-updated"

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

function notifyUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}

function isType(value: unknown): value is NotificationType {
  return typeof value === "string" && (TYPES as string[]).includes(value)
}

function isRelated(value: unknown): value is NotificationRelatedType {
  return typeof value === "string" && (RELATED as string[]).includes(value)
}

export function normalizeNotification(value: Partial<Notification>): Notification | null {
  if (!value.id || !value.userId || !isType(value.type)) return null
  if (typeof value.title !== "string" || typeof value.message !== "string") return null
  if (typeof value.createdAt !== "string") return null
  return {
    id: value.id,
    userId: value.userId,
    type: value.type,
    title: value.title,
    message: value.message,
    relatedId: typeof value.relatedId === "string" ? value.relatedId : undefined,
    relatedType: isRelated(value.relatedType) ? value.relatedType : undefined,
    link: typeof value.link === "string" ? value.link : undefined,
    read: Boolean(value.read),
    createdAt: value.createdAt,
    readAt: typeof value.readAt === "string" ? value.readAt : undefined,
  }
}

function readAll(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Notification>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const notification = normalizeNotification(item)
      return notification ? [notification] : []
    })
  } catch {
    return []
  }
}

function writeAll(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  notifyUpdated()
}

function newestFirst(notifications: Notification[]) {
  return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function isNotificationsReady() {
  return isNotificationsHydrated()
}

export function getNotifications(userId: string): Notification[] {
  if (isSupabaseConfigured()) {
    return peekCachedNotifications().filter((item) => item.userId === userId)
  }
  return newestFirst(readAll().filter((item) => item.userId === userId))
}

export function getUnreadNotifications(userId: string): Notification[] {
  return getNotifications(userId).filter((item) => !item.read)
}

export function getUnreadNotificationCount(userId: string) {
  return getUnreadNotifications(userId).length
}

function hasUniqueMatch(input: CreateNotificationInput) {
  if (!input.relatedId) return false
  return readAll().some(
    (item) =>
      item.userId === input.userId &&
      item.type === input.type &&
      item.relatedId === input.relatedId &&
      item.title === input.title,
  )
}

export function createNotification(input: CreateNotificationInput): Notification | null {
  if (isSupabaseConfigured()) return null
  if (!input.userId) return null
  if (input.unique && hasUniqueMatch(input)) return null
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedId: input.relatedId,
    relatedType: input.relatedType,
    read: false,
    createdAt: new Date().toISOString(),
  }
  writeAll([notification, ...readAll()])
  return notification
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
  if (isSupabaseConfigured()) {
    try {
      return await markNotificationReadRemote(notificationId)
    } catch {
      return null
    }
  }
  const current = readAll().find((item) => item.id === notificationId && item.userId === userId)
  if (!current) return null
  const next = { ...current, read: true }
  writeAll(readAll().map((item) => (item.id === notificationId && item.userId === userId ? next : item)))
  return next
}

export async function markNotificationAsUnread(notificationId: string, userId: string): Promise<Notification | null> {
  if (isSupabaseConfigured()) {
    try {
      return await markNotificationUnreadRemote(notificationId)
    } catch {
      return null
    }
  }
  const current = readAll().find((item) => item.id === notificationId && item.userId === userId)
  if (!current) return null
  const next = { ...current, read: false }
  writeAll(readAll().map((item) => (item.id === notificationId && item.userId === userId ? next : item)))
  return next
}

export async function markAllNotificationsAsRead(userId: string) {
  if (isSupabaseConfigured()) {
    await markAllNotificationsReadRemote()
    return
  }
  writeAll(readAll().map((item) => (item.userId === userId ? { ...item, read: true } : item)))
}

export function formatNotificationTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const diff = Date.now() - date.getTime()
  if (diff < 45_000) return "Just now"
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  if (date >= startOfYesterday && date < startOfToday) return "Yesterday"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Web same-tab/mock bus. Mobile: refetch on focus; use notifications Realtime. */
export function subscribeNotificationUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === NOTIFICATIONS_STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}
