import { getMobileSupabaseClient } from "./supabase"

type ToggleFavoriteResult = {
  listingId: string
  favorited: boolean
}

type FavoriteRow = {
  listing_id?: unknown
}

export async function getMyFavoriteListingIds(): Promise<string[]> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("get_my_favorites")
  if (error) throw error
  const rows = Array.isArray(data) ? data : []
  return rows.flatMap((row) => {
    const listingId = (row as FavoriteRow).listing_id
    return typeof listingId === "string" ? [listingId] : []
  })
}

export async function toggleFavoriteRemote(listingId: string): Promise<ToggleFavoriteResult> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("toggle_favorite", { p_listing_id: listingId })
  if (error) throw error
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Unable to update favorites.")
  const row = data as { listing_id?: unknown; favorited?: unknown }
  if (typeof row.listing_id !== "string") throw new Error("Unable to update favorites.")
  return { listingId: row.listing_id, favorited: row.favorited === true }
}

export async function getCartItemCount(): Promise<number> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("get_my_cart")
  if (error) throw error
  return Array.isArray(data) ? data.length : 0
}

export async function addToCartRemote(listingId: string) {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("add_to_cart", { p_listing_id: listingId })
  if (error) throw error
  return mapCartLine(Array.isArray(data) ? data[0] : data) ?? {
    id: "",
    listingId,
    quantity: 1,
  }
}

export type CartLine = {
  id: string
  listingId: string
  quantity: number
  listingStatus?: string
  listingIsDemo?: boolean
  availableQuantity?: number
  isAvailable?: boolean
}

function mapCartLine(row: unknown): CartLine | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null
  const record = row as {
    id?: unknown
    listing_id?: unknown
    quantity?: unknown
    listing_status?: unknown
    listing_is_demo?: unknown
    available_quantity?: unknown
    is_available?: unknown
  }
  const listingId = typeof record.listing_id === "string" ? record.listing_id : null
  const quantity = Number(record.quantity)
  if (!listingId || !Number.isInteger(quantity) || quantity < 1) return null
  const availableRaw = record.available_quantity
  const available =
    typeof availableRaw === "number" && Number.isFinite(availableRaw)
      ? availableRaw
      : typeof availableRaw === "string" && Number.isFinite(Number(availableRaw))
        ? Number(availableRaw)
        : undefined
  return {
    id: typeof record.id === "string" ? record.id : listingId,
    listingId,
    quantity,
    listingStatus: typeof record.listing_status === "string" ? record.listing_status : undefined,
    listingIsDemo: record.listing_is_demo == null ? undefined : record.listing_is_demo === true,
    availableQuantity: available,
    isAvailable: record.is_available == null ? undefined : record.is_available === true,
  }
}

export async function getMyCartLines(): Promise<CartLine[]> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("get_my_cart")
  if (error) throw error
  const rows = Array.isArray(data) ? data : []
  return rows.flatMap((row) => {
    const item = mapCartLine(row)
    return item ? [item] : []
  })
}

export async function updateCartQuantityRemote(listingId: string, quantity: number): Promise<CartLine> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("update_cart_quantity", {
    p_listing_id: listingId,
    p_quantity: quantity,
  })
  if (error) throw error
  const item = mapCartLine(Array.isArray(data) ? data[0] : data)
  if (!item) throw new Error("Unable to update cart.")
  return item
}

export async function removeFromCartRemote(listingId: string) {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("remove_from_cart", { p_listing_id: listingId })
  if (error) throw error
  const row = data && typeof data === "object" && !Array.isArray(data) ? (data as { listing_id?: unknown; removed?: unknown }) : null
  return {
    listingId: typeof row?.listing_id === "string" ? row.listing_id : listingId,
    removed: row?.removed === true,
  }
}

export async function clearCartRemote() {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("clear_cart")
  if (error) throw error
  return typeof data === "number" ? data : Number(data) || 0
}

export async function startConversationRemote(listingId: string): Promise<string> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("start_conversation", { p_listing_id: listingId })
  if (error) throw error
  const payload = data as { conversation?: { id?: unknown } } | null
  const id = payload?.conversation?.id
  if (typeof id !== "string") throw new Error("Unable to start conversation.")
  return id
}

export async function getInboxUnreadCount(userId: string): Promise<number> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client
    .from("conversation_inbox")
    .select("buyer_id, seller_id, unread_for_buyer, unread_for_seller")
  if (error) throw error
  const rows = Array.isArray(data) ? data : []
  return rows.reduce((total, row) => {
    const record = row as {
      buyer_id?: string
      seller_id?: string
      unread_for_buyer?: number | null
      unread_for_seller?: number | null
    }
    if (record.buyer_id === userId) return total + Math.max(0, Number(record.unread_for_buyer) || 0)
    if (record.seller_id === userId) return total + Math.max(0, Number(record.unread_for_seller) || 0)
    return total
  }, 0)
}
