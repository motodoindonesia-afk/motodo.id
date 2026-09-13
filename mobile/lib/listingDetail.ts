import { LISTING_IMAGES_BUCKET } from "../../src/lib/platform/listingStorage"
import { MOTORCYCLE_CATEGORIES, type HomeListing, type MotorcycleCategory } from "../types/marketplace"
import { coerceListingQuantity } from "./format"
import { fetchSellerListingCards } from "./sellerListingCards"
import { getMobileSupabaseClient } from "./supabase"

const DETAIL_SELECT =
  "id, seller_id, name, brand, model, category, price, condition, year, mileage, engine, transmission, fuel, color, city, location, showroom_address, description, quantity, status, is_demo, listing_images(public_url, storage_path, sort_order)"

const RELATED_SELECT = "id, seller_id, name, brand, model, category, price, city, location, status, is_demo, listing_images(public_url, storage_path, sort_order)"
const RELATED_CANDIDATES = 12
const RELATED_LIMIT = 8

type ImageRow = {
  public_url?: string | null
  storage_path?: string | null
  sort_order?: number | null
}

type ListingRow = {
  id: string
  seller_id: string
  name: string
  brand: string | null
  model: string | null
  category: string | null
  price: number | string
  condition?: string | null
  year?: number | null
  mileage?: number | null
  engine?: string | null
  transmission?: string | null
  fuel?: string | null
  color?: string | null
  city: string | null
  location: string | null
  showroom_address?: string | null
  description?: string | null
  quantity?: number | string | null
  status: string
  is_demo?: boolean | null
  listing_images?: ImageRow[] | null
}

export type ListingSeller = {
  id: string
  name: string
  city: string
  coverUrl: string | null
  verified: boolean
  joinedYear: string | null
  listingCount: number | null
  ratingAverage: number | null
  ratingCount: number
}

export type ListingDetail = {
  id: string
  sellerId: string
  name: string
  brand: string
  model: string
  category: MotorcycleCategory
  price: number
  city: string
  location: string
  showroomAddress: string
  description: string
  condition: string
  year: number | null
  mileage: number | null
  engine: string
  transmission: string
  fuel: string
  color: string
  images: string[]
  status: string
  isDemo: boolean
  quantity: number
  available: number
  listingRatingAverage: number | null
  listingRatingCount: number
  seller: ListingSeller
}

export type ListingDetailResult =
  | { kind: "ok"; listing: ListingDetail; related: HomeListing[] }
  | { kind: "not_found" }
  | { kind: "inactive"; listing: ListingDetail; related: HomeListing[] }

function isCategory(value: string | null): value is MotorcycleCategory {
  return Boolean(value && (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value))
}

function text(value: string | null | undefined) {
  return value?.trim() || ""
}

function listingImages(row: ListingRow, client: ReturnType<typeof getMobileSupabaseClient>) {
  const images = [...(row.listing_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return images.flatMap((image) => {
    if (image.public_url?.trim()) return [image.public_url.trim()]
    if (image.storage_path) {
      return [client.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(image.storage_path).data.publicUrl]
    }
    return []
  })
}

function mapHomeListing(
  row: ListingRow,
  client: ReturnType<typeof getMobileSupabaseClient>,
  sellerName: string,
): HomeListing {
  const price = typeof row.price === "string" ? Number(row.price) : row.price
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    brand: row.brand ?? "",
    model: row.model ?? "",
    category: isCategory(row.category) ? row.category : "Others",
    price: Number.isFinite(price) ? price : 0,
    city: text(row.city) || text(row.location),
    location: text(row.location),
    image: listingImages(row, client)[0] ?? null,
    status: row.status,
    isDemo: row.is_demo === true,
    sellerName,
  }
}

function relatedScore(item: HomeListing, current: ListingDetail) {
  let score = 0
  if (item.category === current.category) score += 4
  if (item.brand && current.brand && item.brand === current.brand) score += 3
  if (item.city && current.city && item.city === current.city) score += 2
  if (current.price > 0) {
    const delta = Math.abs(item.price - current.price) / current.price
    if (delta <= 0.25) score += 2
    else if (delta <= 0.5) score += 1
  }
  return score
}

export async function fetchListingDetail(id: string): Promise<ListingDetailResult> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.from("listings").select(DETAIL_SELECT).eq("id", id).maybeSingle()
  if (error) throw error
  if (!data) return { kind: "not_found" }

  const row = data as ListingRow
  const images = listingImages(row, client)
  const sellerId = row.seller_id

  const [stockResult, cards, sellerRatingResult, listingRatingResult, countResult, relatedResult] = await Promise.all([
    client.from("listing_stock").select("id, available_quantity").eq("id", row.id).maybeSingle(),
    fetchSellerListingCards([sellerId]),
    client.from("seller_rating_summary").select("seller_id, review_count, average_rating").eq("seller_id", sellerId).maybeSingle(),
    client.from("listing_rating_summary").select("listing_id, review_count, average_rating").eq("listing_id", row.id).maybeSingle(),
    client.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", sellerId).eq("status", "active"),
    client
      .from("listings")
      .select(RELATED_SELECT)
      .eq("status", "active")
      .neq("id", row.id)
      .order("created_at", { ascending: false })
      .limit(RELATED_CANDIDATES),
  ])

  if (stockResult.error) throw stockResult.error
  if (sellerRatingResult.error) throw sellerRatingResult.error
  if (listingRatingResult.error) throw listingRatingResult.error
  if (countResult.error) throw countResult.error
  if (relatedResult.error) throw relatedResult.error

  const stockAvailable = stockResult.data
    ? Number((stockResult.data as { available_quantity?: unknown }).available_quantity)
    : null
  const quantity = coerceListingQuantity(row.quantity)
  const available = Number.isFinite(stockAvailable) ? Math.max(0, stockAvailable as number) : quantity

  const card = cards[0] as {
    business_name?: string | null
    city?: string | null
    created_at?: string | null
    store_cover_url?: string | null
  } | undefined
  const sellerName = text(card?.business_name) || "Motodo Seller"
  const sellerCity = text(card?.city)
  const joinedYear = (() => {
    if (!card?.created_at) return null
    const year = new Date(card.created_at).getFullYear()
    return Number.isNaN(year) ? null : String(year)
  })()

  const sellerRating = sellerRatingResult.data as { review_count?: number; average_rating?: number | string | null } | null
  const sellerRatingCount = Math.max(0, Number(sellerRating?.review_count) || 0)
  const sellerRatingRaw =
    typeof sellerRating?.average_rating === "string" ? Number(sellerRating.average_rating) : sellerRating?.average_rating

  const listingRating = listingRatingResult.data as { review_count?: number; average_rating?: number | string | null } | null
  const listingRatingCount = Math.max(0, Number(listingRating?.review_count) || 0)
  const listingRatingRaw =
    typeof listingRating?.average_rating === "string" ? Number(listingRating.average_rating) : listingRating?.average_rating

  const price = typeof row.price === "string" ? Number(row.price) : row.price
  const listing: ListingDetail = {
    id: row.id,
    sellerId,
    name: row.name,
    brand: text(row.brand),
    model: text(row.model),
    category: isCategory(row.category) ? row.category : "Others",
    price: Number.isFinite(price) ? price : 0,
    city: text(row.city),
    location: text(row.location),
    showroomAddress: text(row.showroom_address),
    description: text(row.description),
    condition: text(row.condition),
    year: typeof row.year === "number" && row.year > 0 ? row.year : null,
    mileage: typeof row.mileage === "number" && row.mileage >= 0 ? row.mileage : null,
    engine: text(row.engine),
    transmission: text(row.transmission),
    fuel: text(row.fuel),
    color: text(row.color),
    images,
    status: row.status,
    isDemo: row.is_demo === true,
    quantity,
    available,
    listingRatingAverage:
      listingRatingCount > 0 && listingRatingRaw != null && Number.isFinite(Number(listingRatingRaw))
        ? Number(listingRatingRaw)
        : null,
    listingRatingCount,
    seller: {
      id: sellerId,
      name: sellerName,
      city: sellerCity,
      coverUrl: text(card?.store_cover_url) || null,
      verified: Boolean(card),
      joinedYear,
      listingCount: typeof countResult.count === "number" ? countResult.count : null,
      ratingAverage:
        sellerRatingCount > 0 && sellerRatingRaw != null && Number.isFinite(Number(sellerRatingRaw))
          ? Number(sellerRatingRaw)
          : null,
      ratingCount: sellerRatingCount,
    },
  }

  const relatedRows = (Array.isArray(relatedResult.data) ? relatedResult.data : []) as ListingRow[]
  const relatedSellerIds = [...new Set(relatedRows.map((item) => item.seller_id))]
  const relatedCards =
    relatedSellerIds.length > 0
      ? await client.from("seller_listing_cards").select("id, business_name").in("id", relatedSellerIds)
      : { data: [], error: null }
  if (relatedCards.error) throw relatedCards.error
  const relatedSellerName = new Map<string, string>()
  for (const cardRow of (relatedCards.data as { id: string; business_name: string | null }[] | null) ?? []) {
    relatedSellerName.set(cardRow.id, text(cardRow.business_name) || "Motodo Seller")
  }
  const related = relatedRows
    .map((item) => mapHomeListing(item, client, relatedSellerName.get(item.seller_id) || "Motodo Seller"))
    .map((item) => ({ item, score: relatedScore(item, listing) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RELATED_LIMIT)
    .map((entry) => entry.item)

  if (listing.status !== "active" && listing.status !== "sold") {
    return { kind: "inactive", listing, related: [] }
  }
  return { kind: "ok", listing, related }
}

export async function fetchListingPreviews(ids: string[]) {
  if (ids.length === 0) return new Map<string, HomeListing>()
  const client = getMobileSupabaseClient()
  const { data, error } = await client.from("listings").select(RELATED_SELECT).in("id", ids)
  if (error) throw error
  const rows = (Array.isArray(data) ? data : []) as ListingRow[]
  const sellerIds = [...new Set(rows.map((row) => row.seller_id))]
  const cards = await fetchSellerListingCards(sellerIds)
  const sellerName = new Map(cards.map((card) => [card.id, card.business_name?.trim() || "Motodo Seller"] as const))
  const map = new Map<string, HomeListing>()
  for (const row of rows) {
    map.set(row.id, mapHomeListing(row, client, sellerName.get(row.seller_id) || "Motodo Seller"))
  }
  return map
}
