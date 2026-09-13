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
  const row = Array.isArray(data) ? data[0] : data
  const listing = (row as { listing_id?: unknown } | null)?.listing_id
  const quantity = Number((row as { quantity?: unknown } | null)?.quantity)
  return {
    listingId: typeof listing === "string" ? listing : listingId,
    quantity: Number.isInteger(quantity) && quantity >= 1 ? quantity : 1,
  }
}

export async function getMyCartLines(): Promise<{ listingId: string; quantity: number }[]> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("get_my_cart")
  if (error) throw error
  const rows = Array.isArray(data) ? data : []
  return rows.flatMap((row) => {
    const listingId = (row as { listing_id?: unknown }).listing_id
    const quantity = Number((row as { quantity?: unknown }).quantity)
    if (typeof listingId !== "string") return []
    return [{ listingId, quantity: Number.isInteger(quantity) && quantity >= 1 ? quantity : 1 }]
  })
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
