import { coerceListingQuantity } from "./listingForm"
import { peekListingStock } from "./listingsSupabase"
import { isSupabaseConfigured } from "./supabase"

export const ORDERS_STORAGE_KEY_READONLY = "motodo_orders"
export const INVENTORY_RESERVATION_MIGRATION_KEY = "motodo.inventory_reservation_v1"

type ReservingStatus = "pending" | "confirmed"

function isReservingStatus(value: unknown): value is ReservingStatus {
  return value === "pending" || value === "confirmed"
}

function readReservingUnitsByListing(): Map<string, number> {
  const reserved = new Map<string, number>()
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY_READONLY)
    if (!raw) return reserved
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return reserved
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const record = item as { listingId?: unknown; quantity?: unknown; status?: unknown }
      if (typeof record.listingId !== "string" || !isReservingStatus(record.status)) continue
      const quantity = coerceListingQuantity(record.quantity)
      if (quantity < 1) continue
      reserved.set(record.listingId, (reserved.get(record.listingId) ?? 0) + quantity)
    }
  } catch {
    return reserved
  }
  return reserved
}

export function getReservedQuantityForListing(listingId: string) {
  if (isSupabaseConfigured()) return peekListingStock(listingId)?.reserved ?? 0
  return readReservingUnitsByListing().get(listingId) ?? 0
}

/** Purchasable units: total stock minus pending/confirmed reservations. Never negative. */
export function getAvailableStock(listing: { id: string; quantity?: number; status?: string }) {
  if (listing.status === "draft") return 0
  if (isSupabaseConfigured()) {
    const stock = peekListingStock(listing.id)
    if (stock) return stock.available
    return Math.max(0, coerceListingQuantity(listing.quantity))
  }
  const total = coerceListingQuantity(listing.quantity)
  const reserved = getReservedQuantityForListing(listing.id)
  return Math.max(0, total - reserved)
}

export function listingStockSummary(listing: { id: string; quantity?: number; status?: string }) {
  if (isSupabaseConfigured()) {
    const stock = peekListingStock(listing.id)
    const total = stock?.total ?? coerceListingQuantity(listing.quantity)
    const reserved = stock?.reserved ?? 0
    const available = listing.status === "draft" ? 0 : (stock?.available ?? Math.max(0, total - reserved))
    return { total, reserved, available }
  }
  const total = coerceListingQuantity(listing.quantity)
  const reserved = getReservedQuantityForListing(listing.id)
  const available = listing.status === "draft" ? 0 : Math.max(0, total - reserved)
  return { total, reserved, available }
}
