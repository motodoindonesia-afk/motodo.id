/**
 * Shared store-cover contract for Motodo web and a future native client.
 * Compression is client-specific (web Canvas vs native). Upload uses this bucket/path + RLS.
 */

export const SELLER_STORE_COVERS_BUCKET = "seller-store-covers"
export const STORE_COVER_OBJECT_NAME = "cover.webp"
export const STORE_COVER_MAX_BYTES = 5 * 1024 * 1024
export const STORE_COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type StoreCoverValidationCode = "unsupported" | "too_large"

export function sellerStoreCoverStoragePath(sellerId: string) {
  return `${sellerId}/${STORE_COVER_OBJECT_NAME}`
}

export function storeCoverValidationError(input: { type: string; size: number }): StoreCoverValidationCode | null {
  const type = input.type.trim().toLowerCase()
  const allowed =
    type === "image/jpg" ||
    (STORE_COVER_MIME_TYPES as readonly string[]).includes(type)
  if (!allowed) return "unsupported"
  if (input.size > STORE_COVER_MAX_BYTES) return "too_large"
  return null
}
