import { featuredListings } from "../../data/listings"
import { getPublicListings, isListingsReady } from "../../lib/listings"
import { isSupabaseConfigured } from "../../lib/supabase"
import type { MotorcycleListing } from "../../types/marketplace"

/** Public catalog for homepage rails. Same contract as browse / seller storefronts (includes demo inventory). */
export function getPublicHomeListings(): MotorcycleListing[] | null {
  if (!isListingsReady()) return null
  const publicListings = getPublicListings()
  if (isSupabaseConfigured()) return publicListings
  return featuredListings.flatMap((listing) => {
    const live = publicListings.find((item) => item.id === listing.id)
    return live ? [live] : []
  })
}
