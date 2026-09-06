import type { SellerProfile, SellerProfileInput, SellerStatus } from "../types/seller"
import { BUSINESS_TYPES, type BusinessType } from "../types/seller"
import { MOCK_ADMIN_USER_ID } from "./admin"
import { ensureUserExists } from "./auth"
import { createNotification } from "./notifications"
import { isSupabaseConfigured } from "./supabase"
import {
  approveSellerProfile,
  createSellerProfile as createSellerProfileRemote,
  isSellerProfilesHydrated,
  peekCachedSellerProfile,
  peekCachedSellerProfileById,
  peekCachedSellerProfileList,
  rejectSellerProfile,
  resubmitMySellerProfile,
  updateMySellerProfile,
} from "./sellerProfiles"

export function isSellerProfilesReady() {
  return isSellerProfilesHydrated()
}

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
    sellerFleetAvailable: false,
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
    sellerFleetAvailable: false,
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
    sellerFleetAvailable: false,
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
    sellerFleetAvailable: false,
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
    sellerFleetAvailable: false,
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
    businessHours: typeof value.businessHours === "string" && value.businessHours.trim() ? value.businessHours.trim() : undefined,
    sellerFleetAvailable: Boolean(value.sellerFleetAvailable),
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
  if (isSupabaseConfigured()) {
    return peekCachedSellerProfileList() ?? []
  }
  ensureSeededSellers()
  return readProfiles().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function isSellerFleetAvailable(sellerId: string) {
  return Boolean(getSellerProfile(sellerId)?.sellerFleetAvailable)
}

export function getSellerProfile(userId: string): SellerProfile | null {
  if (isSupabaseConfigured()) {
    const cached = peekCachedSellerProfile(userId)
    if (cached !== undefined) return cached
  }
  ensureSeededSellers()
  return readProfiles().find((profile) => profile.userId === userId) ?? null
}

export function getSellerProfileById(id: string): SellerProfile | null {
  if (isSupabaseConfigured()) {
    const cached = peekCachedSellerProfileById(id) ?? peekCachedSellerProfile(id)
    if (cached) return cached
  }
  ensureSeededSellers()
  return readProfiles().find((profile) => profile.id === id) ?? null
}

export function hasSellerProfile(userId: string) {
  return getSellerProfile(userId) !== null
}

export function isApprovedSeller(userId: string) {
  return getSellerProfile(userId)?.status === "approved"
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
  if (isSupabaseConfigured()) return createSellerProfileRemote(input)
  await delay()
  const existing = getSellerProfile(input.userId)
  if (existing) return existing

  const profile: SellerProfile = {
    ...input,
    instagram: input.instagram?.trim() || undefined,
    website: input.website?.trim() || undefined,
    businessHours: input.businessHours?.trim() || undefined,
    sellerFleetAvailable: Boolean(input.sellerFleetAvailable),
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  writeProfiles([...readProfiles(), profile])
  notifyAdminSellerRegistration(profile.id)
  return profile
}

function notifyAdminSellerRegistration(sellerId: string) {
  createNotification({
    userId: MOCK_ADMIN_USER_ID,
    type: "seller_registration",
    title: "New Seller Registration",
    message: "A new seller is waiting for verification.",
    relatedId: sellerId,
    relatedType: "seller",
    unique: true,
  })
}

export async function updateSellerProfile(
  userId: string,
  patch: Partial<Omit<SellerProfile, "id" | "userId" | "createdAt" | "status" | "rejectionReason" | "reviewedAt" | "reviewedBy">>,
): Promise<SellerProfile | null> {
  if (isSupabaseConfigured()) return updateMySellerProfile(patch)
  await delay()
  const current = getSellerProfile(userId)
  if (!current) return null
  const next = normalizeProfile({
    ...current,
    ...patch,
    id: current.id,
    userId: current.userId,
    createdAt: current.createdAt,
    status: current.status,
    rejectionReason: current.rejectionReason,
    reviewedAt: current.reviewedAt,
    reviewedBy: current.reviewedBy,
    nib: current.status === "approved" ? current.nib : patch.nib ?? current.nib,
    instagram: patch.instagram !== undefined ? patch.instagram.trim() || undefined : current.instagram,
    website: patch.website !== undefined ? patch.website.trim() || undefined : current.website,
    businessHours:
      patch.businessHours !== undefined ? patch.businessHours.trim() || undefined : current.businessHours,
    sellerFleetAvailable:
      patch.sellerFleetAvailable !== undefined ? Boolean(patch.sellerFleetAvailable) : current.sellerFleetAvailable,
  })
  if (!next) return null
  writeProfiles(readProfiles().map((profile) => (profile.userId === userId ? next : profile)))
  return next
}

export async function resubmitSellerProfile(userId: string, input: SellerProfileInput): Promise<SellerProfile> {
  if (isSupabaseConfigured()) return resubmitMySellerProfile(input)
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
    businessHours: input.businessHours?.trim() || current?.businessHours,
    sellerFleetAvailable: input.sellerFleetAvailable ?? current?.sellerFleetAvailable ?? false,
    status: "pending",
    rejectionReason: undefined,
    reviewedAt: undefined,
    reviewedBy: undefined,
  }
  const others = readProfiles().filter((item) => item.userId !== userId)
  writeProfiles([...others, profile])
  notifyAdminSellerRegistration(profile.id)
  return profile
}

export async function approveSeller(id: string, adminUserId: string): Promise<SellerProfile | null> {
  if (isSupabaseConfigured()) return approveSellerProfile(id)
  await delay()
  const current = getSellerProfileById(id)
  if (!current) return null
  if (current.status === "approved") return current
  const next: SellerProfile = {
    ...current,
    status: "approved",
    rejectionReason: undefined,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
  }
  writeProfiles(readProfiles().map((profile) => (profile.id === id ? next : profile)))
  notifySellerRegistrationDecision(next)
  return next
}

export async function rejectSeller(
  id: string,
  adminUserId: string,
  reason: string,
): Promise<SellerProfile | null> {
  if (isSupabaseConfigured()) return rejectSellerProfile(id, reason)
  await delay()
  const current = getSellerProfileById(id)
  if (!current) return null
  const trimmedReason = reason.trim()
  if (current.status === "rejected" && current.rejectionReason === trimmedReason) return current
  const next: SellerProfile = {
    ...current,
    status: "rejected",
    rejectionReason: trimmedReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
  }
  writeProfiles(readProfiles().map((profile) => (profile.id === id ? next : profile)))
  notifySellerRegistrationDecision(next)
  return next
}

function notifySellerRegistrationDecision(profile: SellerProfile) {
  if (profile.status === "approved") {
    createNotification({
      userId: profile.userId,
      type: "seller_registration",
      title: "Seller application approved",
      message: "Your Motodo seller application has been approved. You can now start managing your listings.",
      relatedId: profile.id,
      relatedType: "seller",
      unique: true,
    })
    return
  }
  if (profile.status === "rejected") {
    const reason = profile.rejectionReason?.trim()
    createNotification({
      userId: profile.userId,
      type: "seller_registration",
      title: "Seller application rejected",
      message: reason
        ? `Your Motodo seller application was not approved. ${reason}`
        : "Your Motodo seller application was not approved.",
      relatedId: profile.id,
      relatedType: "seller",
      unique: true,
    })
  }
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
