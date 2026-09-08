/**
 * Wishlist / cart eligibility helpers (web + mobile).
 * Database/RPC remains authoritative.
 *
 * Favorites: demo, sold, and inactive-but-visible listings may stay on a wishlist.
 * Cart: demo listings cannot be added (same DEMO_LISTING_NOT_FOR_SALE as create_order).
 * Cart never reserves inventory.
 */

export function isListingEligibleForFavorite(listing: {
  status?: string
  sellerId?: string
} | null | undefined, viewerId?: string) {
  if (!listing) return false
  if (listing.status === "active" || listing.status === "sold") return true
  if (viewerId && listing.sellerId === viewerId) return true
  return false
}

export function isListingEligibleForCart(listing: {
  isDemo?: boolean
  status?: string
  sellerId?: string
} | null | undefined, viewerId?: string) {
  if (!listing) return false
  if (listing.isDemo === true) return false
  if (listing.status !== "active") return false
  if (viewerId && listing.sellerId === viewerId) return false
  return true
}

/** Cart quantity must be a whole number >= 1 and not above available units. */
export function cartQuantityIsAllowed(quantity: number, available: number, listingTotal: number) {
  if (!Number.isInteger(quantity) || quantity < 1) return false
  if (quantity > listingTotal) return false
  if (quantity > available) return false
  return true
}

/** Checkout eligibility from get_my_cart flags. RPC/create_order remain authoritative. */
export function isCartLinePurchasable(item: {
  isAvailable?: boolean
  listingIsDemo?: boolean
  listingStatus?: string
} | null | undefined) {
  if (!item) return false
  if (item.listingIsDemo === true) return false
  if (item.listingStatus && item.listingStatus !== "active") return false
  return item.isAvailable === true
}
