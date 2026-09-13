import { MOTORCYCLE_CATEGORIES } from "../types/marketplace"
import type {
  MotorcycleListing,
  MotorcycleListingInput,
  SellerListingStatus,
} from "../types/sellerListing"
import { LISTING_CONDITIONS, LISTING_FUELS, LISTING_TRANSMISSIONS } from "../types/sellerListing"
import { coerceListingQuantity } from "./listingForm"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

export const LISTING_IMAGES_BUCKET = "listing-images"
const LISTINGS_UPDATED_EVENT = "motodo:listings-updated"

type ListingImageRow = {
  id: string
  listing_id: string
  storage_path: string
  public_url: string | null
  sort_order: number
}

type ListingRow = {
  id: string
  seller_id: string
  name: string
  brand: string
  model: string | null
  category: string
  price: number | string
  condition: string | null
  year: number | null
  mileage: number | null
  engine: string | null
  transmission: string | null
  fuel: string | null
  color: string | null
  city: string | null
  location: string | null
  showroom_address: string | null
  description: string | null
  quantity: number
  status: string
  created_at: string
  updated_at: string
  is_demo?: boolean
  listing_images?: ListingImageRow[] | null
}

export type SellerListingCard = {
  id: string
  businessName: string
  city: string
  createdAt: string
  store_cover_url: string | null
}

export type ListingStock = {
  total: number
  reserved: number
  available: number
}

const listingCache = new Map<string, MotorcycleListing>()
const sellerCards = new Map<string, SellerListingCard>()
const listingStock = new Map<string, ListingStock>()
let hydrated = false

function notifyListingsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LISTINGS_UPDATED_EVENT))
  }
}

export function isListingsHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setListingsHydrated(value: boolean) {
  hydrated = value
  notifyListingsUpdated()
}

export function clearListingCache() {
  listingCache.clear()
  sellerCards.clear()
  listingStock.clear()
  hydrated = false
  notifyListingsUpdated()
}

export function peekListingStock(id: string): ListingStock | undefined {
  return listingStock.get(id)
}

export function putListingStock(id: string, stock: ListingStock) {
  listingStock.set(id, stock)
  notifyListingsUpdated()
}

type ListingStockRow = {
  id: string
  total_quantity: number
  reserved_quantity: number
  available_quantity: number
}

function rememberStockRow(row: ListingStockRow) {
  listingStock.set(row.id, {
    total: coerceListingQuantity(row.total_quantity),
    reserved: Math.max(0, Number(row.reserved_quantity) || 0),
    available: Math.max(0, Number(row.available_quantity) || 0),
  })
}

export async function refreshListingStock(listingIds?: string[]) {
  const client = getSupabaseClient()
  let query = client.from("listing_stock").select("id, total_quantity, reserved_quantity, available_quantity")
  if (listingIds && listingIds.length > 0) query = query.in("id", listingIds)
  const { data, error } = await query
  if (error) return
  for (const row of (data as ListingStockRow[] | null) ?? []) rememberStockRow(row)
  notifyListingsUpdated()
}

export function peekCachedListings(): MotorcycleListing[] {
  return [...listingCache.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function peekCachedListing(id: string): MotorcycleListing | undefined {
  return listingCache.get(id)
}

export function getSellerListingCard(sellerId: string): SellerListingCard | undefined {
  return sellerCards.get(sellerId)
}

export function rememberSellerListingCard(card: SellerListingCard) {
  sellerCards.set(card.id, card)
  notifyListingsUpdated()
}

function mapSellerListingCardRow(row: {
  id: string
  business_name: string | null
  city: string | null
  created_at: string
  store_cover_url?: string | null
}): SellerListingCard {
  return {
    id: row.id,
    businessName: row.business_name ?? "Motodo Seller",
    city: row.city ?? "",
    createdAt: row.created_at,
    store_cover_url: row.store_cover_url?.trim() || null,
  }
}

function rememberListing(listing: MotorcycleListing) {
  listingCache.set(listing.id, listing)
  notifyListingsUpdated()
}

export function putCachedListing(listing: MotorcycleListing) {
  rememberListing(listing)
}

function forgetListing(id: string) {
  listingCache.delete(id)
  notifyListingsUpdated()
}

function isCategory(value: unknown): value is MotorcycleListing["category"] {
  return typeof value === "string" && (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value)
}

function isStatus(value: unknown): value is SellerListingStatus {
  return value === "draft" || value === "active" || value === "sold"
}

function emptyOr<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | "" {
  if (!value) return ""
  return (allowed as readonly string[]).includes(value) ? (value as T) : ""
}

function publicUrlForPath(path: string) {
  const client = getSupabaseClient()
  const { data } = client.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function imageUrls(rows: ListingImageRow[] | null | undefined): string[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => row.public_url || publicUrlForPath(row.storage_path))
    .filter(Boolean)
    .slice(0, 10)
}

export function mapListingRow(row: ListingRow): MotorcycleListing {
  const price = typeof row.price === "string" ? Number(row.price) : row.price
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    brand: row.brand,
    model: row.model ?? "",
    category: isCategory(row.category) ? row.category : "Others",
    price: Number.isFinite(price) ? price : 0,
    quantity: coerceListingQuantity(row.quantity),
    condition: emptyOr(row.condition, LISTING_CONDITIONS),
    year: row.year ?? 0,
    mileage: row.mileage ?? 0,
    engine: row.engine ?? "",
    transmission: emptyOr(row.transmission, LISTING_TRANSMISSIONS),
    fuel: emptyOr(row.fuel, LISTING_FUELS) || "Petrol",
    color: row.color ?? "",
    city: row.city ?? "",
    location: row.location ?? "",
    showroomAddress: row.showroom_address ?? "",
    description: row.description ?? "",
    images: imageUrls(row.listing_images),
    status: isStatus(row.status) ? row.status : "draft",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDemo: row.is_demo === true,
  }
}

function listingWritePayload(input: MotorcycleListingInput) {
  return {
    name: input.name.trim() || "Untitled motorcycle",
    brand: input.brand.trim() || "Unknown",
    model: input.model.trim() || null,
    category: input.category,
    price: Math.max(0, input.price),
    condition: input.condition || null,
    year: input.year >= 1900 ? input.year : null,
    mileage: Math.max(0, input.mileage),
    engine: input.engine.trim() || null,
    transmission: input.transmission || null,
    fuel: input.fuel || null,
    color: input.color.trim() || null,
    city: input.city.trim() || null,
    location: input.location.trim() || null,
    showroom_address: input.showroomAddress.trim() || null,
    description: input.description.trim() || null,
    quantity: coerceListingQuantity(input.quantity),
    status: input.status,
  }
}

function listingSelect() {
  return "*, listing_images(id, listing_id, storage_path, public_url, sort_order)"
}

function asListingRows(data: unknown): ListingRow[] {
  return Array.isArray(data) ? (data as ListingRow[]) : []
}

function asListingRow(data: unknown): ListingRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as ListingRow
}

async function requireUserId() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()
  if (error) throwUserFacing(error, "Unable to verify your session.")
  const userId = data.session?.user.id
  if (!userId) throw new Error("You must be logged in.")
  return { client, userId }
}

async function refreshSellerCards(sellerIds: string[]) {
  const unique = [...new Set(sellerIds.filter(Boolean))]
  if (unique.length === 0) return
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("seller_listing_cards")
    .select("id, business_name, city, created_at, store_cover_url")
    .in("id", unique)
  if (error) return
  for (const row of data ?? []) {
    sellerCards.set(row.id, mapSellerListingCardRow(row))
  }
}

function cacheRows(rows: ListingRow[]) {
  for (const row of rows) rememberListing(mapListingRow(row))
}

export async function ensureSellerListingCard(sellerId: string) {
  if (!sellerId || !isSupabaseConfigured()) return
  if (sellerCards.has(sellerId)) return
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("seller_listing_cards")
    .select("id, business_name, city, created_at, store_cover_url")
    .eq("id", sellerId)
    .maybeSingle()
  if (error || !data) return
  rememberSellerListingCard(mapSellerListingCardRow(data))
}

export async function hydrateListings() {
  const client = getSupabaseClient()
  const { data, error } = await client.from("listings").select(listingSelect()).order("updated_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load listings.")
  listingCache.clear()
  const rows = asListingRows(data)
  cacheRows(rows)
  await refreshSellerCards(rows.map((row) => row.seller_id))
  await refreshListingStock(rows.map((row) => row.id))
  hydrated = true
  notifyListingsUpdated()
}

export async function getPublicActiveListings(): Promise<MotorcycleListing[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("listings")
    .select(listingSelect())
    .eq("status", "active")
    .order("created_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load listings.")
  const rows = asListingRows(data)
  cacheRows(rows)
  await refreshSellerCards(rows.map((row) => row.seller_id))
  await refreshListingStock(rows.map((row) => row.id))
  return rows.map(mapListingRow)
}

export async function getListingByIdRemote(id: string): Promise<MotorcycleListing | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.from("listings").select(listingSelect()).eq("id", id).maybeSingle()
  if (error) throwUserFacing(error, "Unable to load listings.")
  const row = asListingRow(data)
  if (!row) return null
  const listing = mapListingRow(row)
  rememberListing(listing)
  await refreshSellerCards([listing.sellerId])
  await refreshListingStock([listing.id])
  return listing
}

export async function ensureRemoteListing(id: string): Promise<MotorcycleListing | null> {
  return peekCachedListing(id) ?? getListingByIdRemote(id)
}

export async function getMyListings(): Promise<MotorcycleListing[]> {
  const { client, userId } = await requireUserId()
  const { data, error } = await client
    .from("listings")
    .select(listingSelect())
    .eq("seller_id", userId)
    .order("updated_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load listings.")
  const rows = asListingRows(data)
  cacheRows(rows)
  return rows.map(mapListingRow)
}

export async function getListingByIdForSeller(id: string): Promise<MotorcycleListing | null> {
  const { userId } = await requireUserId()
  const listing = await getListingByIdRemote(id)
  if (!listing || listing.sellerId !== userId) return null
  return listing
}

async function fetchImageRows(listingId: string): Promise<ListingImageRow[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("listing_images")
    .select("id, listing_id, storage_path, public_url, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true })
  if (error) throwUserFacing(error, "Unable to load listings.")
  return (data as ListingImageRow[] | null) ?? []
}

function isDataImage(src: string) {
  return src.startsWith("data:image/")
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || "image/jpeg" })
}

export async function uploadListingImage(listingId: string, source: string | File, sortOrder: number) {
  const client = getSupabaseClient()
  const file =
    typeof source === "string" ? await dataUrlToFile(source, `${crypto.randomUUID()}.jpg`) : source
  const path = `listings/${listingId}/${crypto.randomUUID()}.jpg`
  const { error: uploadError } = await client.storage.from(LISTING_IMAGES_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  })
  if (uploadError) throwUserFacing(uploadError, "Unable to upload that photo.")
  const publicUrl = publicUrlForPath(path)
  const { data, error } = await client
    .from("listing_images")
    .insert({
      listing_id: listingId,
      storage_path: path,
      public_url: publicUrl,
      sort_order: sortOrder,
    })
    .select("id, listing_id, storage_path, public_url, sort_order")
    .single()
  if (error) {
    await client.storage.from(LISTING_IMAGES_BUCKET).remove([path])
    throwUserFacing(error, "Unable to save listing photo.")
  }
  return data as ListingImageRow
}

export async function deleteListingImage(listingId: string, imageRef: string) {
  const rows = await fetchImageRows(listingId)
  const row = rows.find(
    (item) => item.id === imageRef || item.public_url === imageRef || publicUrlForPath(item.storage_path) === imageRef,
  )
  if (!row) return
  const client = getSupabaseClient()
  const { error: dbError } = await client.from("listing_images").delete().eq("id", row.id).eq("listing_id", listingId)
  if (dbError) throwUserFacing(dbError, "Unable to remove that photo.")
  await client.storage.from(LISTING_IMAGES_BUCKET).remove([row.storage_path])
}

export async function reorderListingImages(listingId: string, orderedUrls: string[]) {
  const rows = await fetchImageRows(listingId)
  const client = getSupabaseClient()
  for (let index = 0; index < orderedUrls.length; index += 1) {
    const url = orderedUrls[index]
    const row = rows.find(
      (item) => item.public_url === url || publicUrlForPath(item.storage_path) === url || item.id === url,
    )
    if (!row) continue
    const { error } = await client.from("listing_images").update({ sort_order: index }).eq("id", row.id).eq("listing_id", listingId)
    if (error) throwUserFacing(error, "Unable to load listings.")
  }
}

async function syncListingImages(listingId: string, images: string[]) {
  const desired = images.filter(Boolean).slice(0, 10)
  const current = await fetchImageRows(listingId)
  const keep = new Set(
    desired.filter((src) => !isDataImage(src)),
  )

  for (const row of current) {
    const url = row.public_url || publicUrlForPath(row.storage_path)
    if (!keep.has(url) && !keep.has(row.id)) {
      await deleteListingImage(listingId, row.id)
    }
  }

  const remaining = await fetchImageRows(listingId)
  const nextUrls: string[] = []
  for (let index = 0; index < desired.length; index += 1) {
    const src = desired[index]
    if (isDataImage(src)) {
      const uploaded = await uploadListingImage(listingId, src, index)
      nextUrls.push(uploaded.public_url || publicUrlForPath(uploaded.storage_path))
    } else {
      const row = remaining.find(
        (item) => item.public_url === src || publicUrlForPath(item.storage_path) === src,
      )
      if (row) {
        const client = getSupabaseClient()
        await client.from("listing_images").update({ sort_order: index }).eq("id", row.id).eq("listing_id", listingId)
        nextUrls.push(src)
      }
    }
  }
  return nextUrls
}

async function reloadListing(id: string) {
  const listing = await getListingByIdRemote(id)
  if (!listing) throw new Error("Listing not found.")
  return listing
}

export async function createListingRemote(input: MotorcycleListingInput): Promise<MotorcycleListing> {
  const { client, userId } = await requireUserId()
  const { data, error } = await client
    .from("listings")
    .insert({
      seller_id: userId,
      ...listingWritePayload(input),
    })
    .select(listingSelect())
    .single()
  if (error) throwUserFacing(error, "Unable to load listings.")
  const row = asListingRow(data)
  if (!row) throw new Error("Unable to create listing.")
  const created = mapListingRow(row)
  rememberListing(created)
  if (input.images.length > 0) {
    await syncListingImages(created.id, input.images)
    return reloadListing(created.id)
  }
  return created
}

export async function updateListingRemote(listing: MotorcycleListing, sellerId: string): Promise<MotorcycleListing> {
  const { client, userId } = await requireUserId()
  if (userId !== sellerId) throw new Error("You don't have permission to access this listing.")
  const current = peekCachedListing(listing.id) ?? (await getListingByIdRemote(listing.id))
  if (!current) throw new Error("Listing not found.")
  if (current.sellerId !== userId) throw new Error("You don't have permission to access this listing.")

  const { error } = await client
    .from("listings")
    .update(listingWritePayload({ ...listing, sellerId: userId }))
    .eq("id", listing.id)
    .eq("seller_id", userId)
  if (error) throwUserFacing(error, "Unable to load listings.")
  await syncListingImages(listing.id, listing.images)
  return reloadListing(listing.id)
}

export async function deleteListingRemote(id: string, sellerId: string): Promise<boolean> {
  const { client, userId } = await requireUserId()
  if (userId !== sellerId) return false
  const current = peekCachedListing(id) ?? (await getListingByIdRemote(id))
  if (!current || current.sellerId !== userId) return false
  const rows = await fetchImageRows(id)
  const { error } = await client.from("listings").delete().eq("id", id).eq("seller_id", userId)
  if (error) throwUserFacing(error, "Unable to load listings.")
  if (rows.length > 0) {
    await client.storage.from(LISTING_IMAGES_BUCKET).remove(rows.map((row) => row.storage_path))
  }
  forgetListing(id)
  return true
}

export async function updateListingStatusRemote(id: string, status: SellerListingStatus): Promise<MotorcycleListing | null> {
  const { client, userId } = await requireUserId()
  const { data, error } = await client
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("seller_id", userId)
    .select(listingSelect())
    .maybeSingle()
  if (error) throwUserFacing(error, "Unable to load listings.")
  const row = asListingRow(data)
  if (!row) return null
  const listing = mapListingRow(row)
  rememberListing(listing)
  return listing
}

export async function adminSetListingStatusRemote(id: string, status: Extract<SellerListingStatus, "active" | "draft">) {
  const { client } = await requireUserId()
  const { data, error } = await client.from("listings").update({ status }).eq("id", id).select(listingSelect()).maybeSingle()
  if (error) throwUserFacing(error, "Unable to load listings.")
  const adminRow = asListingRow(data)
  if (!adminRow) return null
  const listing = mapListingRow(adminRow)
  rememberListing(listing)
  return listing
}

export async function updateListingQuantityRemote(id: string, quantity: number, status: SellerListingStatus) {
  const { client, userId } = await requireUserId()
  const { data, error } = await client
    .from("listings")
    .update({ quantity: coerceListingQuantity(quantity), status })
    .eq("id", id)
    .eq("seller_id", userId)
    .select(listingSelect())
    .maybeSingle()
  if (error) throwUserFacing(error, "Unable to load listings.")
  const qtyRow = asListingRow(data)
  if (!qtyRow) return null
  const listing = mapListingRow(qtyRow)
  rememberListing(listing)
  return listing
}

export async function markListingSold(id: string) {
  return updateListingStatusRemote(id, "sold")
}

export async function markListingActive(id: string) {
  return updateListingStatusRemote(id, "active")
}
