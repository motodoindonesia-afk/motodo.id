import { SELLER_STORE_COVERS_BUCKET, STORE_COVER_MAX_BYTES, sellerStoreCoverStoragePath } from "./platform/storeCover"
import { rememberSellerListingCard } from "./listingsSupabase"
import { getMySellerProfile, updateMySellerProfile } from "./sellerProfiles"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"
import { throwUserFacing } from "./userFacingError"

export { SELLER_STORE_COVERS_BUCKET, sellerStoreCoverStoragePath } from "./platform/storeCover"

function publicCoverUrl(path: string, cacheKey: number) {
  const client = getSupabaseClient()
  const { data } = client.storage.from(SELLER_STORE_COVERS_BUCKET).getPublicUrl(path)
  const base = data.publicUrl.split("?")[0]
  return `${base}?v=${cacheKey}`
}

export async function uploadSellerStoreCover(blob: Blob): Promise<string> {
  if (blob.size > STORE_COVER_MAX_BYTES) throw new Error("STORE_COVER_TOO_LARGE")

  if (!isSupabaseConfigured()) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("STORE_COVER_UPLOAD_FAILED"))
      reader.readAsDataURL(blob)
    })
    const profile = await updateMySellerProfile({ store_cover_url: dataUrl })
    return profile.store_cover_url ?? dataUrl
  }

  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throwUserFacing(sessionError, "Unable to verify your session.")
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("You must be logged in.")

  const current = await getMySellerProfile()
  if (!current) throw new Error("Seller profile not found.")
  if (current.status !== "approved") throw new Error("STORE_COVER_NOT_APPROVED")

  const path = sellerStoreCoverStoragePath(userId)
  const contentType = blob.type || "image/webp"
  const { error: uploadError } = await client.storage.from(SELLER_STORE_COVERS_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  })
  if (uploadError) throw new Error("STORE_COVER_UPLOAD_FAILED")

  const nextUrl = publicCoverUrl(path, Date.now())
  const profile = await updateMySellerProfile({ store_cover_url: nextUrl })
  const cover = profile.store_cover_url ?? nextUrl
  rememberSellerListingCard({
    id: profile.id,
    businessName: profile.businessName,
    city: profile.city,
    createdAt: profile.createdAt,
    store_cover_url: cover,
  })
  return cover
}
