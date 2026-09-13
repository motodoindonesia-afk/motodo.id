import { LISTING_IMAGES_BUCKET } from "../../src/lib/platform/listingStorage"
import { MOTORCYCLE_CATEGORIES, type HomeGarage, type HomeListing, type MotorcycleCategory } from "../types/marketplace"
import { fetchSellerListingCards } from "./sellerListingCards"
import { getMobileSupabaseClient } from "./supabase"

const HOME_LISTING_LIMIT = 24
const LISTING_SELECT = "id, seller_id, name, brand, model, category, price, city, location, status, is_demo, listing_images(public_url, storage_path, sort_order)"

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
  city: string | null
  location: string | null
  status: string
  is_demo?: boolean | null
  listing_images?: ImageRow[] | null
}

function isCategory(value: string | null): value is MotorcycleCategory {
  return Boolean(value && (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value))
}

function listingImage(row: ListingRow, client: ReturnType<typeof getMobileSupabaseClient>) {
  const images = [...(row.listing_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const first = images[0]
  if (first?.public_url?.trim()) return first.public_url.trim()
  if (first?.storage_path) {
    return client.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(first.storage_path).data.publicUrl
  }
  return null
}

export async function fetchHomeMarketplace(): Promise<{ listings: HomeListing[]; garages: HomeGarage[] }> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(HOME_LISTING_LIMIT)
  if (error) throw error

  const rows = (Array.isArray(data) ? data : []) as ListingRow[]
  const listingIds = rows.map((row) => row.id)
  const sellerIds = [...new Set(rows.map((row) => row.seller_id).filter(Boolean))]

  const [stockResult, cards, ratingResult] = await Promise.all([
    listingIds.length
      ? client.from("listing_stock").select("id, available_quantity").in("id", listingIds)
      : Promise.resolve({ data: [], error: null }),
    fetchSellerListingCards(sellerIds),
    sellerIds.length
      ? client.from("seller_rating_summary").select("seller_id, review_count, average_rating").in("seller_id", sellerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const available = new Map<string, number>()
  for (const row of (stockResult.data as { id: string; available_quantity: number }[] | null) ?? []) {
    available.set(row.id, Number(row.available_quantity) || 0)
  }

  const sellerName = new Map<string, string>()
  const sellerCity = new Map<string, string>()
  const sellerCover = new Map<string, string | null>()
  for (const row of cards) {
    sellerName.set(row.id, row.business_name?.trim() || "Motodo Seller")
    sellerCity.set(row.id, row.city?.trim() || "")
    sellerCover.set(row.id, row.store_cover_url?.trim() || null)
  }

  const ratings = new Map<string, { average: number | null; count: number }>()
  for (const row of (ratingResult.data as { seller_id: string; review_count: number; average_rating: number | string | null }[] | null) ?? []) {
    const count = Math.max(0, Number(row.review_count) || 0)
    const raw = typeof row.average_rating === "string" ? Number(row.average_rating) : row.average_rating
    ratings.set(row.seller_id, {
      count,
      average: count > 0 && raw != null && Number.isFinite(raw) ? Number(raw) : null,
    })
  }

  const listings: HomeListing[] = rows.flatMap((row) => {
    if (available.has(row.id) && (available.get(row.id) ?? 0) <= 0) return []
    const price = typeof row.price === "string" ? Number(row.price) : row.price
    return [
      {
        id: row.id,
        sellerId: row.seller_id,
        name: row.name,
        brand: row.brand ?? "",
        model: row.model ?? "",
        category: isCategory(row.category) ? row.category : "Others",
        price: Number.isFinite(price) ? price : 0,
        city: row.city?.trim() || row.location?.trim() || "",
        location: row.location?.trim() || "",
        image: listingImage(row, client),
        status: row.status,
        isDemo: row.is_demo === true,
        sellerName: sellerName.get(row.seller_id) || "Motodo Seller",
      },
    ]
  })

  const listingCount = new Map<string, number>()
  for (const listing of listings) {
    listingCount.set(listing.sellerId, (listingCount.get(listing.sellerId) ?? 0) + 1)
  }

  const garages: HomeGarage[] = sellerIds.flatMap((id) => {
    const name = sellerName.get(id)
    if (!name) return []
    const rating = ratings.get(id)
    return [
      {
        id,
        businessName: name,
        city: sellerCity.get(id) || "",
        coverUrl: sellerCover.get(id) ?? null,
        listingCount: listingCount.get(id) ?? 0,
        ratingAverage: rating?.average ?? null,
        ratingCount: rating?.count ?? 0,
      },
    ]
  })

  return { listings, garages }
}
