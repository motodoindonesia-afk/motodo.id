import type { SellerProfile, SellerProfileInput, SellerStatus } from "../types/seller"
import { BUSINESS_TYPES, type BusinessType } from "../types/seller"
import { ensureUserExists } from "./auth"

export const SELLER_STORAGE_KEY = "motodo.sellerProfiles"
export const SELLER_UPDATED_EVENT = "motodo:sellers-updated"

const delay = (ms = 500) => new Promise((resolve) => window.setTimeout(resolve, ms))

const SEED_IDS = [
  "seed-seller-pending",
  "seed-seller-pending-2",
  "seed-seller-approved",
  "seed-seller-approved-2",
  "seed-seller-rejected",
] as const

const SEEDED_SELLERS: SellerProfile[] = [
  {
    id: "seed-seller-pending",
    userId: "seed-user-pending",
    fullName: "Raka Pratama",
    email: "raka.garage@motodo.test",
    phone: "081298765432",
    businessName: "Kemang Custom Works",
    businessType: "Custom Garage",
    nib: "9123456789012",
    yearEstablished: 2016,
    city: "Jakarta Selatan",
    showroomAddress: "Jl. Kemang Selatan No. 8",
    postalCode: "12730",
    instagram: "@kemangcustom",
    description: "Custom Harley builds, tank fabrication, and show-quality paint in South Jakarta.",
    status: "pending",
    createdAt: "2026-08-20T08:00:00.000Z",
  },
  {
    id: "seed-seller-pending-2",
    userId: "seed-user-pending-2",
    fullName: "Sinta Maharani",
    email: "sinta.cafe@motodo.test",
    phone: "081577889900",
    businessName: "Cirebon Cafe Racers",
    businessType: "Custom Garage",
    nib: "6123456789012",
    yearEstablished: 2021,
    city: "Cirebon",
    showroomAddress: "Jl. Siliwangi No. 21",
    postalCode: "45121",
    instagram: "@cireboncaferacers",
    description: "Cafe racer conversions and small-batch custom frames from Cirebon.",
    status: "pending",
    createdAt: "2026-08-28T08:00:00.000Z",
  },
  {
    id: "seed-seller-approved",
    userId: "seed-user-approved",
    fullName: "Dewi Lestari",
    email: "dewi.twins@motodo.test",
    phone: "081311223344",
    businessName: "Bandung Twin Garage",
    businessType: "Motorcycle Dealer",
    nib: "8123456789012",
    yearEstablished: 2014,
    city: "Bandung",
    showroomAddress: "Jl. Dago No. 45",
    postalCode: "40135",
    website: "https://bandungtwin.id",
    description: "Triumph and classic British twins, dealer servicing, and highland test rides.",
    status: "approved",
    createdAt: "2026-07-12T08:00:00.000Z",
    reviewedAt: "2026-07-14T09:00:00.000Z",
    reviewedBy: "mock-admin-motodo",
  },
  {
    id: "seed-seller-approved-2",
    userId: "seed-user-approved-2",
    fullName: "Maya Kusuma",
    email: "maya.customs@motodo.test",
    phone: "081399887766",
    businessName: "Bali Machine Works",
    businessType: "Custom Garage",
    nib: "5123456789012",
    yearEstablished: 2018,
    city: "Bali",
    showroomAddress: "Jl. Sunset Road No. 12",
    postalCode: "80361",
    instagram: "@balimachineworks",
    description: "Custom tanks, powder coating, and island test rides from a Kuta showroom.",
    status: "approved",
    createdAt: "2026-06-04T08:00:00.000Z",
    reviewedAt: "2026-06-06T09:00:00.000Z",
    reviewedBy: "mock-admin-motodo",
  },
  {
    id: "seed-seller-rejected",
    userId: "seed-user-rejected",
    fullName: "Andi Wijaya",
    email: "andi.workshop@motodo.test",
    phone: "082112223333",
    businessName: "Surabaya Street Workshop",
    businessType: "Motorcycle Workshop",
    nib: "7123456789012",
    yearEstablished: 2019,
    city: "Surabaya",
    showroomAddress: "Jl. Darmo Permai III No. 2",
    postalCode: "60226",
    description: "General workshop with occasional custom parts. No dedicated showroom floor.",
    status: "rejected",
    createdAt: "2026-08-02T08:00:00.000Z",
    rejectionReason: "Motodo sellers must operate from a physical showroom. Please add a dedicated display space and resubmit.",
    reviewedAt: "2026-08-04T10:00:00.000Z",
    reviewedBy: "mock-admin-motodo",
  },
]

function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === "string" && (BUSINESS_TYPES as readonly string[]).includes(value)
}

function isStatus(value: unknown): value is SellerStatus {
  return value === "pending" || value === "approved" || value === "rejected"
}

function normalizeProfile(value: Partial<SellerProfile>): SellerProfile | null {
  if (!value.id || !value.userId || !value.email || !value.fullName) return null
  if (!value.phone || !value.businessName || !isBusinessType(value.businessType)) return null
  if (!value.nib || !value.city || !value.showroomAddress || !value.postalCode) return null
  if (!value.description || typeof value.yearEstablished !== "number") return null
  if (!isStatus(value.status) || typeof value.createdAt !== "string") return null

  return {
    id: value.id,
    userId: value.userId,
    fullName: value.fullName,
    email: value.email,
    phone: value.phone,
    businessName: value.businessName,
    businessType: value.businessType,
    nib: value.nib,
    yearEstablished: value.yearEstablished,
    city: value.city,
    showroomAddress: value.showroomAddress,
    postalCode: value.postalCode,
    instagram: value.instagram || undefined,
    website: value.website || undefined,
    description: value.description,
    status: value.status,
    createdAt: value.createdAt,
    rejectionReason: value.rejectionReason || undefined,
    reviewedAt: value.reviewedAt || undefined,
    reviewedBy: value.reviewedBy || undefined,
  }
}

function notifySellersUpdated() {
  window.dispatchEvent(new Event(SELLER_UPDATED_EVENT))
}

function readProfiles(): SellerProfile[] {
  try {
    const raw = localStorage.getItem(SELLER_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<SellerProfile>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const profile = normalizeProfile(item)
      return profile ? [profile] : []
    })
  } catch {
    return []
  }
}

function writeProfiles(profiles: SellerProfile[]) {
  localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(profiles))
  notifySellersUpdated()
}

export function ensureSeededSellerAccounts() {
  for (const seed of SEEDED_SELLERS) {
    ensureUserExists({
      id: seed.userId,
      fullName: seed.fullName,
      email: seed.email,
      role: "seller",
      createdAt: seed.createdAt,
    })
  }
}

export function ensureSeededSellers() {
  const existing = readProfiles()
  const ids = new Set(existing.map((item) => item.id))
  const emails = new Set(existing.map((item) => item.email))
  const extras = SEEDED_SELLERS.filter((seed) => !ids.has(seed.id) && !emails.has(seed.email))
  if (extras.length === 0) return
  writeProfiles([...existing, ...extras])
}

export function listSellerProfiles(): SellerProfile[] {
  ensureSeededSellers()
  return readProfiles().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getSellerProfile(userId: string): SellerProfile | null {
  ensureSeededSellers()
  return readProfiles().find((profile) => profile.userId === userId) ?? null
}

export function getSellerProfileById(id: string): SellerProfile | null {
  ensureSeededSellers()
  return readProfiles().find((profile) => profile.id === id) ?? null
}

export function hasSellerProfile(userId: string) {
  return getSellerProfile(userId) !== null
}

export function getSellerStats() {
  const profiles = listSellerProfiles()
  return {
    total: profiles.length,
    pending: profiles.filter((item) => item.status === "pending").length,
    approved: profiles.filter((item) => item.status === "approved").length,
    rejected: profiles.filter((item) => item.status === "rejected").length,
  }
}

export async function createSellerProfile(input: SellerProfileInput): Promise<SellerProfile> {
  await delay()
  const existing = getSellerProfile(input.userId)
  if (existing) return existing

  const profile: SellerProfile = {
    ...input,
    instagram: input.instagram?.trim() || undefined,
    website: input.website?.trim() || undefined,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  writeProfiles([...readProfiles(), profile])
  return profile
}

export async function updateSellerProfile(
  userId: string,
  patch: Partial<Omit<SellerProfile, "id" | "userId" | "email" | "createdAt" | "status">>,
): Promise<SellerProfile | null> {
  await delay()
  const current = getSellerProfile(userId)
  if (!current) return null
  const next = normalizeProfile({
    ...current,
    ...patch,
    instagram: patch.instagram !== undefined ? patch.instagram.trim() || undefined : current.instagram,
    website: patch.website !== undefined ? patch.website.trim() || undefined : current.website,
  })
  if (!next) return null
  writeProfiles(readProfiles().map((profile) => (profile.userId === userId ? next : profile)))
  return next
}

export async function resubmitSellerProfile(userId: string, input: SellerProfileInput): Promise<SellerProfile> {
  await delay()
  const current = getSellerProfile(userId)
  const profile: SellerProfile = {
    ...(current ?? {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      userId,
      email: input.email,
    }),
    ...input,
    instagram: input.instagram?.trim() || undefined,
    website: input.website?.trim() || undefined,
    status: "pending",
    rejectionReason: undefined,
    reviewedAt: undefined,
    reviewedBy: undefined,
  }
  const others = readProfiles().filter((item) => item.userId !== userId)
  writeProfiles([...others, profile])
  return profile
}

export async function approveSeller(id: string, adminUserId: string): Promise<SellerProfile | null> {
  await delay()
  const current = getSellerProfileById(id)
  if (!current) return null
  const next: SellerProfile = {
    ...current,
    status: "approved",
    rejectionReason: undefined,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
  }
  writeProfiles(readProfiles().map((profile) => (profile.id === id ? next : profile)))
  return next
}

export async function rejectSeller(
  id: string,
  adminUserId: string,
  reason: string,
): Promise<SellerProfile | null> {
  await delay()
  const current = getSellerProfileById(id)
  if (!current) return null
  const next: SellerProfile = {
    ...current,
    status: "rejected",
    rejectionReason: reason.trim(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
  }
  writeProfiles(readProfiles().map((profile) => (profile.id === id ? next : profile)))
  return next
}

export function subscribeSellerUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SELLER_STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(SELLER_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(SELLER_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}

export function statusLabel(status: SellerStatus) {
  if (status === "approved") return "Approved"
  if (status === "rejected") return "Rejected"
  return "Pending Verification"
}

export function sellerStatusHeading(status: SellerStatus) {
  if (status === "approved") return "Verified Seller"
  if (status === "rejected") return "Seller Registration Rejected"
  return "Seller Verification Pending"
}

export function isSeedSeller(id: string) {
  return (SEED_IDS as readonly string[]).includes(id)
}
