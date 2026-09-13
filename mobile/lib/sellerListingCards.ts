import { getMobileSupabaseClient } from "./supabase"

export type SellerListingCardRow = {
  id: string
  business_name: string | null
  city: string | null
  created_at: string | null
  store_cover_url: string | null
}

function missingCoverColumn(message: string | undefined) {
  return Boolean(message && message.includes("store_cover_url"))
}

export async function fetchSellerListingCards(ids: string[]): Promise<SellerListingCardRow[]> {
  if (ids.length === 0) return []
  const client = getMobileSupabaseClient()
  const full = await client
    .from("seller_listing_cards")
    .select("id, business_name, city, created_at, store_cover_url")
    .in("id", ids)
  if (!full.error) return (full.data ?? []) as SellerListingCardRow[]
  if (!missingCoverColumn(full.error.message)) throw full.error

  const basic = await client.from("seller_listing_cards").select("id, business_name, city, created_at").in("id", ids)
  if (basic.error) throw basic.error
  return ((basic.data ?? []) as Array<Omit<SellerListingCardRow, "store_cover_url">>).map((row) => ({
    ...row,
    store_cover_url: null,
  }))
}
