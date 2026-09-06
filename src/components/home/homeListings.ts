import { featuredListings } from "../../data/listings"
import { getPublicListings, isListingsReady } from "../../lib/listings"
import { isListingPurchasable } from "../../lib/orders"
import { isSupabaseConfigured } from "../../lib/supabase"
import type { MotorcycleListing } from "../../types/marketplace"

export function getPublicHomeListings(): MotorcycleListing[] | null {
  if (!isListingsReady()) return null
  const publicListings = getPublicListings().filter((listing) => isListingPurchasable(listing))
  if (isSupabaseConfigured()) return publicListings
  return featuredListings.flatMap((listing) => {
    const live = publicListings.find((item) => item.id === listing.id)
    return live ? [live] : []
  })
}
