import type { ListingStatus } from "../types/marketplace"
import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import { getListingsBySeller, toCatalogListing } from "./listings"

export type SellerOwnedListing = CatalogListing & { status: ListingStatus }

export function getListingsForSeller(sellerId: string): SellerOwnedListing[] {
  return getListingsBySeller(sellerId).map((listing) => {
    const catalog = toCatalogListing(listing)
    return { ...catalog, status: listing.status }
  })
}
