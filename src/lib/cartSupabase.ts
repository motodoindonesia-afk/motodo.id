import type { Cart, CartItem, RemoveFromCartResult } from "../types/cart"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient } from "./supabase"

type CartItemRow = {
  id: string
  user_id: string
  listing_id: string
  quantity: number
  created_at: string
  updated_at: string
  listing_status?: string | null
  listing_is_demo?: boolean | null
  available_quantity?: number | null
  is_available?: boolean | null
}

export function mapCartItemRow(row: CartItemRow): CartItem | null {
  if (!row.id || !row.user_id || !row.listing_id || !row.created_at || !row.updated_at) return null
  const quantity = Number(row.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) return null
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listingStatus: typeof row.listing_status === "string" ? row.listing_status : undefined,
    listingIsDemo: row.listing_is_demo == null ? undefined : row.listing_is_demo === true,
    availableQuantity: (() => {
      const raw = row.available_quantity
      if (typeof raw === "number" && Number.isFinite(raw)) return raw
      if (typeof raw === "string" && Number.isFinite(Number(raw))) return Number(raw)
      return undefined
    })(),
    isAvailable: row.is_available == null ? undefined : row.is_available === true,
  }
}

function asCartRows(data: unknown): CartItemRow[] {
  return Array.isArray(data) ? (data as CartItemRow[]) : []
}

function asCartRow(data: unknown): CartItemRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as CartItemRow
}

function firstCartRow(data: unknown): CartItemRow | null {
  return asCartRow(data) ?? asCartRows(data)[0] ?? null
}

export async function getMyCart(): Promise<Cart> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("get_my_cart")
  if (error) throwUserFacing(error, "Unable to load cart.")
  return {
    items: asCartRows(data).flatMap((row) => {
      const item = mapCartItemRow(row)
      return item ? [item] : []
    }),
  }
}

export async function addToCart(listingId: string): Promise<CartItem> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("add_to_cart", { p_listing_id: listingId })
  if (error) throwUserFacing(error, "Unable to add to cart.")
  const item = mapCartItemRow(firstCartRow(data) as CartItemRow)
  if (!item) throw new Error("Unable to add to cart.")
  return item
}

export async function removeFromCart(listingId: string): Promise<RemoveFromCartResult> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("remove_from_cart", { p_listing_id: listingId })
  if (error) throwUserFacing(error, "Unable to update cart.")
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { listingId, removed: false }
  }
  const row = data as { listing_id?: unknown; removed?: unknown }
  return {
    listingId: typeof row.listing_id === "string" ? row.listing_id : listingId,
    removed: row.removed === true,
  }
}

export async function updateCartQuantity(listingId: string, quantity: number): Promise<CartItem> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("update_cart_quantity", {
    p_listing_id: listingId,
    p_quantity: quantity,
  })
  if (error) throwUserFacing(error, "Unable to update cart.")
  const item = mapCartItemRow(firstCartRow(data) as CartItemRow)
  if (!item) throw new Error("Unable to update cart.")
  return item
}

export async function clearCart(): Promise<number> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("clear_cart")
  if (error) throwUserFacing(error, "Unable to update cart.")
  return typeof data === "number" ? data : Number(data) || 0
}
