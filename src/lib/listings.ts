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
import { formatIDR, formatMileageKm, normalizeQuantity } from "./listingForm"

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
    quantity: normalizeQuantity(value.quantity),
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
  if (extras.length === 0) return
  writeListings([...existing, ...extras])
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
  ensureSeededListings()
  migrateMissingQuantity()
  return readListings().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getListingById(id: string): MotorcycleListing | null {
  return getListings().find((item) => item.id === id) ?? null
}

export function getListingsBySeller(sellerId: string): MotorcycleListing[] {
  return getListings().filter((item) => item.sellerId === sellerId)
}

export async function createListing(input: MotorcycleListingInput): Promise<MotorcycleListing> {
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
  await delay()
  const current = getListingById(id)
  if (!current || current.sellerId !== sellerId) return null
  const next: MotorcycleListing = {
    ...current,
    status,
    quantity: status === "active" ? normalizeQuantity(current.quantity) : current.quantity,
    updatedAt: new Date().toISOString(),
  }
  writeListings(readListings().map((item) => (item.id === id ? next : item)))
  return next
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
      name: seller?.businessName ?? "Motodo Seller",
      location: seller?.city ?? listing.city,
      memberSince: seller ? String(new Date(seller.createdAt).getFullYear()) : "2026",
      verified: seller?.status === "approved",
    },
    listedAt: listing.createdAt,
    status: listing.status,
    quantity: listing.quantity,
    condition: listing.condition || undefined,
    brand: listing.brand || undefined,
    model: listing.model || undefined,
  }
}

export function getPublicListings(): CatalogListing[] {
  const published = getListings()
    .filter((item) => item.status === "active")
    .map((item) => toCatalogListing(item))
  const publishedIds = new Set(published.map((item) => item.id))
  const mocks = motorcycleListings.filter((item) => !publishedIds.has(item.id))
  return [...published, ...mocks]
}

export function getPublicListingById(id: string): CatalogListing | undefined {
  const stored = getListingById(id)
  if (stored) {
    if (stored.status === "draft") return undefined
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
