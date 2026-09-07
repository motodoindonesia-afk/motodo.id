/**
 * Demo inventory rule (web + mobile + Ritme).
 *
 * INCLUDE is_demo in:
 * - public catalog (browse, homepage, listing detail, public seller pages) so a seeded demo
 *   environment still has a storefront
 * - seller/Ritme management views (flagged rows, not deleted)
 * - historical demo orders/reviews already in the database
 *
 * EXCLUDE from real transactions:
 * - create_order (database-enforced: DEMO_LISTING_NOT_FOR_SALE)
 * - checkout / purchasable checks in clients
 *
 * Clients must not flip listings.is_demo (protect_listing_columns). Do not delete demo rows.
 */

export function isDemoListing(listing: { isDemo?: boolean } | null | undefined) {
  return listing?.isDemo === true
}

export function isListingEligibleForSale(listing: { isDemo?: boolean; status?: string } | null | undefined) {
  if (!listing) return false
  if (isDemoListing(listing)) return false
  if (listing.status === "draft" || listing.status === "sold") return false
  return true
}
