/**
 * Listing photo Storage contract (web + mobile).
 * Compression is client-specific (web Canvas vs native manipulator).
 * Both clients upload bytes to this bucket/path; RLS owns writes.
 */

export const LISTING_IMAGES_BUCKET = "listing-images"

/** Object key: listings/{listing_id}/{fileName} */
export function listingImageStoragePath(listingId: string, fileName: string) {
  return `listings/${listingId}/${fileName}`
}
