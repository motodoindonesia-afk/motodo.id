import { motorcycleListings } from "../data/listings"
import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import { MOTORCYCLE_CATEGORIES } from "../types/marketplace"
import type { SellerProfile } from "../types/seller"
import type {
  ListingCity,
  ListingCondition,
  ListingFuel,
  ListingTransmission,
  MotorcycleListing,
  MotorcycleListingInput,
  SellerListingStatus,
} from "../types/sellerListing"
import { LISTING_CITIES, LISTING_CONDITIONS, LISTING_FUELS, LISTING_TRANSMISSIONS } from "../types/sellerListing"
import { getSellerProfile } from "./seller"
import { createNotification } from "./notifications"
import { coerceListingQuantity, formatIDR, formatMileageKm, normalizeQuantity } from "./listingForm"
import { getAvailableStock, INVENTORY_RESERVATION_MIGRATION_KEY } from "./inventory"
import { isSupabaseConfigured } from "./supabase"
import { getSellerListingCard, isListingsHydrated, peekCachedListing, peekCachedListings, putCachedListing } from "./listingsSupabase"
import {
  adminSetListingStatusRemote,
  createListingRemote,
  deleteListingRemote,
  ensureRemoteListing,
  updateListingRemote,
  updateListingStatusRemote,
} from "./listingsSupabase"

export function isListingsReady() {
  return isListingsHydrated()
}

export {
  getPublicActiveListings,
  getMyListings,
  getListingByIdForSeller,
  uploadListingImage,
  deleteListingImage,
  reorderListingImages,
  markListingSold,
  markListingActive,
  ensureRemoteListing,
} from "./listingsSupabase"

export const LISTINGS_STORAGE_KEY = "motodo.listings"
export const LISTINGS_UPDATED_EVENT = "motodo:listings-updated"

const delay = (ms = 350) => new Promise((resolve) => window.setTimeout(resolve, ms))

const SEED_LISTING_ID = "seed-listing-bandung-twin"
const SEED_DRAFT_ID = "seed-listing-bandung-draft"
const SEED_SOLD_ID = "seed-listing-bandung-sold"

function seedListings(): MotorcycleListing[] {
  const base = seedListing()
  return [
    base,
    {
      ...base,
      id: SEED_DRAFT_ID,
      name: "Triumph Street Twin project",
      model: "Street Twin",
      price: 98000000,
      year: 2018,
      mileage: 18600,
      status: "draft",
      createdAt: "2026-08-22T08:00:00.000Z",
      updatedAt: "2026-08-22T08:00:00.000Z",
      description:
        "Workshop project Street Twin awaiting photos of the completed tank. Not yet ready for public listing.",
    },
    {
      ...base,
      id: SEED_SOLD_ID,
      name: "Triumph Scrambler 900",
      model: "Scrambler 900",
      price: 142000000,
      year: 2017,
      mileage: 24100,
      status: "sold",
      createdAt: "2026-07-08T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
      description:
        "Scrambler sold from the Bandung showroom. Kept here as sold inventory for the seller record.",
    },
  ]
}

function seedListing(): MotorcycleListing {
  return {
    id: SEED_LISTING_ID,
    sellerId: "seed-user-approved",
    name: "Triumph Bonneville T100",
    brand: "Triumph",
    model: "Bonneville T100",
    category: "Triumph",
    price: 158000000,
    condition: "Very Good",
    year: 2019,
    mileage: 14200,
    engine: "900 cc parallel-twin",
    transmission: "Manual",
    fuel: "Petrol",
    color: "Fusion White",
    city: "Bandung",
    location: "Dago",
    showroomAddress: "Jl. Dago No. 45",
    description:
      "Showroom T100 with a complete service book and highland miles. Stock pipes, heated grips, and no accident history. Suitable for Bandung weekend rides. Papers complete and the bike is ready to view at Bandung Twin Garage.",
    images: ["/listings/triumph.jpg", "/listings/brat.jpg", "/listings/hero.jpg"],
    status: "active",
    quantity: 1,
    createdAt: "2026-08-18T08:00:00.000Z",
    updatedAt: "2026-08-18T08:00:00.000Z",
  }
}

function isCategory(value: unknown): value is MotorcycleListing["category"] {
  return typeof value === "string" && (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value)
}

function isCondition(value: unknown): value is ListingCondition | "" {
  return value === "" || (typeof value === "string" && (LISTING_CONDITIONS as readonly string[]).includes(value))
}

function isTransmission(value: unknown): value is ListingTransmission | "" {
  return value === "" || (typeof value === "string" && (LISTING_TRANSMISSIONS as readonly string[]).includes(value))
}

function isFuel(value: unknown): value is ListingFuel | "" {
  return value === "" || (typeof value === "string" && (LISTING_FUELS as readonly string[]).includes(value))
}

function isStatus(value: unknown): value is SellerListingStatus {
  return value === "draft" || value === "active" || value === "sold"
}

function isCity(value: unknown): value is ListingCity {
  return typeof value === "string" && (LISTING_CITIES as readonly string[]).includes(value)
}

function normalizeListing(value: Partial<MotorcycleListing>): MotorcycleListing | null {
  if (!value.id || !value.sellerId || typeof value.name !== "string") return null
  if (!isCategory(value.category) || typeof value.brand !== "string" || typeof value.model !== "string") return null
  if (typeof value.price !== "number" || typeof value.year !== "number" || typeof value.mileage !== "number") {
    return null
  }
  if (!isCondition(value.condition) || !isTransmission(value.transmission) || !isFuel(value.fuel)) return null
  if (!Array.isArray(value.images) || !isStatus(value.status)) return null
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null

  const city = typeof value.city === "string" ? value.city : ""
  return {
    id: value.id,
    sellerId: value.sellerId,
    name: value.name,
    brand: value.brand,
    model: value.model,
    category: value.category,
    price: value.price,
    condition: value.condition,
    year: value.year,
    mileage: value.mileage,
    engine: typeof value.engine === "string" ? value.engine : "",
    transmission: value.transmission,
    fuel: value.fuel,
    color: typeof value.color === "string" ? value.color : "",
    city: isCity(city) || city ? city : "",
    location: typeof value.location === "string" ? value.location : "",
    showroomAddress: typeof value.showroomAddress === "string" ? value.showroomAddress : "",
    description: typeof value.description === "string" ? value.description : "",
    images: value.images.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 10),
    status: value.status,
    quantity: coerceListingQuantity(value.quantity),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function notifyListingsUpdated() {
  window.dispatchEvent(new Event(LISTINGS_UPDATED_EVENT))
}

function readListings(): MotorcycleListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<MotorcycleListing>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const listing = normalizeListing(item)
      return listing ? [listing] : []
    })
  } catch {
    return []
  }
}

function writeListings(listings: MotorcycleListing[]) {
  localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings))
  notifyListingsUpdated()
}

export function ensureSeededListings() {
  const existing = readListings()
  const ids = new Set(existing.map((item) => item.id))
  const extras = seedListings().filter((item) => !ids.has(item.id))
  if (extras.length !== 0) writeListings([...existing, ...extras])
  migrateDeductedPendingOrdersOntoListingStock()
}

/** Old placeOrder deducted listing.quantity immediately. Add those units back once so quantity is total stock. */
function migrateDeductedPendingOrdersOntoListingStock() {
  try {
    if (localStorage.getItem(INVENTORY_RESERVATION_MIGRATION_KEY)) return
    localStorage.setItem(INVENTORY_RESERVATION_MIGRATION_KEY, "1")
    const raw = localStorage.getItem("motodo_orders")
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    const nextOrders: Record<string, unknown>[] = []
    let changedOrders = false
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        nextOrders.push(item as Record<string, unknown>)
        continue
      }
      const order = item as Record<string, unknown>
      const status = order.status
      const listingId = typeof order.listingId === "string" ? order.listingId : ""
      const quantity = coerceListingQuantity(order.quantity)
      const alreadyRestored = Boolean(order.inventoryRestored)
      if (
        listingId &&
        quantity >= 1 &&
        !alreadyRestored &&
        (status === "pending" || status === "confirmed")
      ) {
        applyListingInventoryChange(listingId, quantity)
        nextOrders.push({ ...order, inventoryRestored: true })
        changedOrders = true
      } else {
        nextOrders.push(order)
      }
    }
    if (changedOrders) {
      localStorage.setItem("motodo_orders", JSON.stringify(nextOrders))
      window.dispatchEvent(new Event("motodo:orders-updated"))
    }
  } catch {
    return
  }
}

function migrateMissingQuantity() {
  try {
    const raw = localStorage.getItem(LISTINGS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return
    const needsWrite = parsed.some((item) => {
      if (!item || typeof item !== "object") return false
      return typeof (item as { quantity?: unknown }).quantity !== "number"
    })
    if (!needsWrite) return
    writeListings(readListings())
  } catch {
    return
  }
}

export function getListings(): MotorcycleListing[] {
  if (isSupabaseConfigured()) return peekCachedListings()
  ensureSeededListings()
  migrateMissingQuantity()
  return readListings().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getListingById(id: string): MotorcycleListing | null {
  if (isSupabaseConfigured()) return peekCachedListing(id) ?? null
  return getListings().find((item) => item.id === id) ?? null
}

export function getListingsBySeller(sellerId: string): MotorcycleListing[] {
  return getListings().filter((item) => item.sellerId === sellerId)
}

export async function createListing(input: MotorcycleListingInput): Promise<MotorcycleListing> {
  if (isSupabaseConfigured()) return createListingRemote(input)
  await delay()
  const now = new Date().toISOString()
  const listing: MotorcycleListing = {
    ...input,
    images: input.images.slice(0, 10),
    quantity: normalizeQuantity(input.quantity),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  try {
    writeListings([listing, ...readListings()])
  } catch {
    throw new Error("Photos are too large to save in this browser. Use fewer or smaller images.")
  }
  return listing
}

export async function updateListing(listing: MotorcycleListing, sellerId: string): Promise<MotorcycleListing> {
  if (isSupabaseConfigured()) return updateListingRemote(listing, sellerId)
  await delay()
  const current = getListingById(listing.id)
  if (!current) throw new Error("Listing not found.")
  if (current.sellerId !== sellerId) throw new Error("You don't have permission to access this listing.")
  const next: MotorcycleListing = {
    ...listing,
    sellerId: current.sellerId,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    images: listing.images.slice(0, 10),
    quantity: normalizeQuantity(listing.quantity),
  }
  try {
    writeListings(readListings().map((item) => (item.id === listing.id ? next : item)))
  } catch {
    throw new Error("Photos are too large to save in this browser. Use fewer or smaller images.")
  }
  return next
}

export async function deleteListing(id: string, sellerId: string): Promise<boolean> {
  if (isSupabaseConfigured()) return deleteListingRemote(id, sellerId)
  await delay()
  const current = getListingById(id)
  if (!current || current.sellerId !== sellerId) return false
  writeListings(readListings().filter((item) => item.id !== id))
  return true
}

export async function publishListing(id: string, sellerId: string): Promise<MotorcycleListing | null> {
  return setListingStatus(id, sellerId, "active")
}

export async function markListingAsSold(id: string, sellerId: string): Promise<MotorcycleListing | null> {
  return setListingStatus(id, sellerId, "sold")
}

export async function markListingAsActive(id: string, sellerId: string): Promise<MotorcycleListing | null> {
  return setListingStatus(id, sellerId, "active")
}

async function setListingStatus(
  id: string,
  sellerId: string,
  status: SellerListingStatus,
): Promise<MotorcycleListing | null> {
  if (isSupabaseConfigured()) {
    const current = peekCachedListing(id) ?? (await ensureRemoteListing(id))
    if (!current || current.sellerId !== sellerId) return null
    if (status === "active") {
      const seller = getSellerProfile(sellerId)
      if (!seller || seller.status !== "approved") return null
      if (current.quantity < 1) return null
    }
    return updateListingStatusRemote(id, status)
  }
  await delay()
  const current = getListingById(id)
  if (!current || current.sellerId !== sellerId) return null
  if (status === "active") {
    const seller = getSellerProfile(sellerId)
    if (!seller || seller.status !== "approved") return null
    if (getAvailableStock(current) < 1) return null
  }
  const next: MotorcycleListing = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  }
  writeListings(readListings().map((item) => (item.id === id ? next : item)))
  notifyInventoryEvents(current, next)
  if (current.status !== next.status && next.status !== "sold") {
    createNotification({
      userId: next.sellerId,
      type: "listing_status",
      title: "Listing Updated",
      message: `Your ${next.name} listing is now ${listingStatusLabel(next.status).toLowerCase()}.`,
      relatedId: next.id,
      relatedType: "listing",
    })
  }
  return next
}

function parseCatalogMileage(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  return digits ? Number(digits) : 0
}

function listingFromCatalog(catalog: CatalogListing): MotorcycleListing {
  const now = new Date().toISOString()
  return {
    id: catalog.id,
    sellerId: catalog.sellerId,
    name: catalog.name,
    brand: catalog.brand ?? "",
    model: catalog.model ?? catalog.name,
    category: catalog.category,
    price: Math.round(catalog.priceValue),
    condition: isCondition(catalog.condition) && catalog.condition ? catalog.condition : "Very Good",
    year: catalog.year,
    mileage: parseCatalogMileage(catalog.mileage),
    engine: catalog.engine,
    transmission: catalog.transmission === "Automatic" ? "Automatic" : "Manual",
    fuel: "Petrol",
    color: catalog.color,
    city: catalog.location,
    location: catalog.location,
    showroomAddress: "",
    description: catalog.description,
    images: catalog.images.length > 0 ? catalog.images : catalog.image ? [catalog.image] : [],
    status: catalog.status === "sold" ? "sold" : catalog.status === "draft" ? "draft" : "active",
    quantity: coerceListingQuantity(catalog.quantity),
    createdAt: catalog.listedAt || now,
    updatedAt: now,
  }
}

export function listAllListingsForAdmin(): MotorcycleListing[] {
  if (isSupabaseConfigured()) return peekCachedListings()
  const stored = getListings()
  const storedIds = new Set(stored.map((item) => item.id))
  const catalogOnly = motorcycleListings
    .filter((item) => !storedIds.has(item.id))
    .map((item) => listingFromCatalog(item))
  return [...stored, ...catalogOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getListingForAdmin(listingId: string): MotorcycleListing | null {
  if (isSupabaseConfigured()) return peekCachedListing(listingId) ?? null
  const stored = getListingById(listingId)
  if (stored) return stored
  const catalog = motorcycleListings.find((item) => item.id === listingId)
  return catalog ? listingFromCatalog(catalog) : null
}

export function adminSetListingStatus(
  listingId: string,
  status: Extract<SellerListingStatus, "active" | "draft">,
): MotorcycleListing | null {
  if (isSupabaseConfigured()) {
    const current = peekCachedListing(listingId)
    if (!current) return null
    if (status === "active" && current.quantity < 1) return null
    const next: MotorcycleListing = { ...current, status, updatedAt: new Date().toISOString() }
    putCachedListing(next)
    void adminSetListingStatusRemote(listingId, status)
    return next
  }
  let current = getListingById(listingId)
  if (!current) {
    const catalog = motorcycleListings.find((item) => item.id === listingId)
    if (!catalog) return null
    current = listingFromCatalog(catalog)
    writeListings([current, ...readListings()])
  }
  if (status === "active" && getAvailableStock(current) < 1) return null
  const next: MotorcycleListing = {
    ...current,
    sellerId: current.sellerId,
    status,
    updatedAt: new Date().toISOString(),
  }
  writeListings(readListings().map((item) => (item.id === listingId ? next : item)))
  return next
}

export function ensureStoredListingForInventory(listingId: string): MotorcycleListing | null {
  if (isSupabaseConfigured()) return peekCachedListing(listingId) ?? null
  const stored = getListingById(listingId)
  if (stored) return stored
  const catalog = motorcycleListings.find((item) => item.id === listingId)
  if (!catalog) return null
  const listing = listingFromCatalog(catalog)
  writeListings([listing, ...readListings()])
  return listing
}

export function applyListingInventoryChange(listingId: string, delta: number): MotorcycleListing | null {
  if (isSupabaseConfigured()) return peekCachedListing(listingId) ?? null
  const current = ensureStoredListingForInventory(listingId)
  if (!current) return null
  const nextQuantity = current.quantity + delta
  if (nextQuantity < 0) return null
  const tentative: MotorcycleListing = {
    ...current,
    quantity: nextQuantity,
    updatedAt: new Date().toISOString(),
  }
  const available = getAvailableStock(tentative)
  let status = current.status
  if (status !== "draft") {
    if (available <= 0) status = "sold"
    else if (status === "sold" && available > 0) status = "active"
  }
  const next: MotorcycleListing = {
    ...tentative,
    status,
  }
  writeListings(readListings().map((item) => (item.id === listingId ? next : item)))
  notifyInventoryEvents(current, next)
  return next
}

/** Update sold/active from purchasable stock without changing total quantity. */
export function syncListingAvailability(listingId: string): MotorcycleListing | null {
  if (isSupabaseConfigured()) return getListingById(listingId)
  const current = getListingById(listingId)
  if (!current || current.status === "draft") return current
  const available = getAvailableStock(current)
  const status: SellerListingStatus = available <= 0 ? "sold" : "active"
  if (status === current.status) return current
  const next: MotorcycleListing = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  }
  writeListings(readListings().map((item) => (item.id === listingId ? next : item)))
  notifyInventoryEvents(current, next)
  return next
}

function notifyInventoryEvents(
  previous: MotorcycleListing,
  next: MotorcycleListing,
) {
  if (next.status === "sold" && previous.status === "active") {
    createNotification({
      userId: next.sellerId,
      type: "listing_sold",
      title: "Motorcycle Sold",
      message: `Your ${next.name} is now sold out.`,
      relatedId: next.id,
      relatedType: "listing",
      unique: true,
    })
  }
  const previousAvailable = getAvailableStock(previous)
  const nextAvailable = getAvailableStock(next)
  if (next.status === "active" && nextAvailable > 0 && nextAvailable <= 2 && previousAvailable > 2) {
    createNotification({
      userId: next.sellerId,
      type: "listing_low_inventory",
      title: "Low Inventory",
      message: `Only ${nextAvailable} ${nextAvailable === 1 ? "unit" : "units"} of ${next.name} remain.`,
      relatedId: next.id,
      relatedType: "listing",
      unique: true,
    })
  }
}

export function getListingPickupDetails(listingId: string) {
  const stored = getListingById(listingId)
  const seller = stored ? getSellerProfile(stored.sellerId) : null
  const catalog = motorcycleListings.find((item) => item.id === listingId)
  return {
    businessName: seller?.businessName || catalog?.seller.name || "",
    city: stored?.city || seller?.city || catalog?.seller.location || "",
    address: stored?.showroomAddress || seller?.showroomAddress || "",
    location: stored
      ? [stored.location, stored.city].filter(Boolean).join(", ")
      : catalog?.location || catalog?.seller.location || "",
  }
}

export function listingStatusLabel(status: SellerListingStatus) {
  if (status === "active") return "Active"
  if (status === "sold") return "Sold"
  return "Draft"
}

export function toCatalogListing(listing: MotorcycleListing, profile?: SellerProfile | null): CatalogListing {
  const cover = listing.images[0] ?? ""
  const area = [listing.location, listing.city].filter(Boolean).join(", ")
  const seller = profile ?? getSellerProfile(listing.sellerId)
  const card = getSellerListingCard(listing.sellerId)
  const catalog = motorcycleListings.find((item) => item.id === listing.id)
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    name: listing.name || "Untitled motorcycle",
    price: formatIDR(listing.price),
    priceValue: listing.price,
    year: listing.year || 0,
    location: area || listing.city,
    category: listing.category,
    image: cover,
    images: listing.images.length > 0 ? listing.images : cover ? [cover] : [],
    mileage: listing.mileage >= 0 && listing.year ? formatMileageKm(listing.mileage) : "—",
    engine: listing.engine || "—",
    transmission: listing.transmission || "—",
    fuel: listing.fuel || "—",
    color: listing.color || "—",
    description: listing.description,
    seller: {
      name: seller?.businessName || card?.businessName || catalog?.seller.name || "Motodo Seller",
      location: seller?.city || card?.city || catalog?.seller.location || listing.city,
      memberSince: seller
        ? String(new Date(seller.createdAt).getFullYear())
        : card
          ? String(new Date(card.createdAt).getFullYear())
          : catalog?.seller.memberSince || "2026",
      verified: seller ? seller.status === "approved" : Boolean(card) || Boolean(catalog?.seller.verified),
    },
    listedAt: listing.createdAt,
    status: listing.status,
    quantity: getAvailableStock(listing),
    condition: listing.condition || undefined,
    brand: listing.brand || undefined,
    model: listing.model || undefined,
  }
}

function sellerMayPublish(sellerId: string) {
  const seller = getSellerProfile(sellerId)
  if (!seller) return true
  return seller.status === "approved"
}

export function getPublicListings(): CatalogListing[] {
  if (isSupabaseConfigured()) {
    return peekCachedListings()
      .filter((item) => item.status === "active" && getAvailableStock(item) > 0 && sellerMayPublish(item.sellerId))
      .map((item) => toCatalogListing(item))
  }
  const stored = getListings()
  const storedIds = new Set(stored.map((item) => item.id))
  const published = stored
    .filter((item) => item.status === "active" && getAvailableStock(item) > 0 && sellerMayPublish(item.sellerId))
    .map((item) => toCatalogListing(item))
  const mocks = motorcycleListings.filter((item) => !storedIds.has(item.id))
  return [...published, ...mocks]
}

export function getPublicListingById(id: string): CatalogListing | undefined {
  if (isSupabaseConfigured()) {
    const stored = peekCachedListing(id)
    if (!stored) return undefined
    if (stored.status === "draft") return undefined
    if (!sellerMayPublish(stored.sellerId)) return undefined
    return toCatalogListing(stored)
  }
  const stored = getListingById(id)
  if (stored) {
    if (stored.status === "draft") return undefined
    if (!sellerMayPublish(stored.sellerId)) return undefined
    return toCatalogListing(stored)
  }
  return motorcycleListings.find((item) => item.id === id)
}

export function getRelatedPublicListings(listing: CatalogListing, limit = 4) {
  const catalog = getPublicListings()
  const sameCategory = catalog.filter((item) => item.id !== listing.id && item.category === listing.category)
  const others = catalog.filter((item) => item.id !== listing.id && item.category !== listing.category)
  return [...sameCategory, ...others].slice(0, limit)
}

export function subscribeListingUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === LISTINGS_STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(LISTINGS_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(LISTINGS_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}

export function canManageListing(listing: MotorcycleListing | null, sellerId: string) {
  return Boolean(listing && listing.sellerId === sellerId)
}

export function getSellerListingCounts(sellerId: string) {
  const listings = getListingsBySeller(sellerId)
  return {
    total: listings.length,
    active: listings.filter((item) => item.status === "active").length,
    draft: listings.filter((item) => item.status === "draft").length,
    sold: listings.filter((item) => item.status === "sold").length,
  }
}

export function getSellerAvailableUnits(sellerId: string) {
  return getListingsBySeller(sellerId)
    .filter((item) => item.status === "active")
    .reduce((total, item) => total + getAvailableStock(item), 0)
}

export function getSellerLowInventoryListings(sellerId: string) {
  return getListingsBySeller(sellerId).filter((item) => {
    if (item.status !== "active") return false
    const available = getAvailableStock(item)
    return available > 0 && available <= 2
  })
}

export function getSellerSoldOutListings(sellerId: string) {
  return getListingsBySeller(sellerId).filter((item) => item.status === "sold" || getAvailableStock(item) === 0)
}

export type SellerListingSort = "newest" | "oldest" | "price-asc" | "price-desc"

export function filterAndSortSellerListings(
  listings: MotorcycleListing[],
  options: { status: "all" | SellerListingStatus; query: string; sort: SellerListingSort },
) {
  const needle = options.query.trim().toLowerCase()
  const filtered = listings.filter((listing) => {
    if (options.status !== "all" && listing.status !== options.status) return false
    if (!needle) return true
    return [listing.name, listing.brand, listing.model].join(" ").toLowerCase().includes(needle)
  })

  return [...filtered].sort((a, b) => {
    if (options.sort === "oldest") return a.createdAt.localeCompare(b.createdAt)
    if (options.sort === "price-asc") return a.price - b.price
    if (options.sort === "price-desc") return b.price - a.price
    return b.createdAt.localeCompare(a.createdAt)
  })
}
