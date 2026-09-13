import type { BusinessType, SellerProfile, SellerProfileInput, SellerStatus } from "../types/seller"
import { BUSINESS_TYPES } from "../types/seller"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

export const SELLER_PROFILES_UPDATED_EVENT = "motodo:sellers-updated"

type SellerProfileRow = {
  id: string
  business_name: string
  business_type: string | null
  nib: string | null
  showroom_name: string | null
  showroom_address: string | null
  city: string | null
  province: string | null
  phone: string | null
  description: string | null
  seller_status: string
  rejection_reason: string | null
  created_at: string
  updated_at: string
  is_demo?: boolean
  store_cover_url?: string | null
}

type SellerProfileRowWithOwner = SellerProfileRow & {
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null
}

type OwnerHints = {
  fullName?: string
  email?: string
}

const cacheByUserId = new Map<string, SellerProfile | null>()
let adminList: SellerProfile[] | null = null
let hydrated = false

function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === "string" && (BUSINESS_TYPES as readonly string[]).includes(value)
}

function isStatus(value: unknown): value is SellerStatus {
  return value === "pending" || value === "approved" || value === "rejected"
}

function notifySellerProfilesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SELLER_PROFILES_UPDATED_EVENT))
  }
}

function ownerName(row: SellerProfileRowWithOwner, hints?: OwnerHints) {
  const nested = row.profiles
  const profile = Array.isArray(nested) ? nested[0] : nested
  const fromJoin = profile?.full_name?.trim()
  return fromJoin || hints?.fullName?.trim() || "Seller"
}

export function mapSellerProfileRow(row: SellerProfileRowWithOwner, hints?: OwnerHints): SellerProfile {
  return {
    id: row.id,
    userId: row.id,
    fullName: ownerName(row, hints),
    email: hints?.email?.trim() || "",
    phone: row.phone?.trim() || "",
    businessName: row.business_name,
    businessType: isBusinessType(row.business_type) ? row.business_type : "Other",
    nib: row.nib?.trim() || "",
    yearEstablished: 0,
    city: row.city?.trim() || "",
    showroomAddress: row.showroom_address?.trim() || "",
    postalCode: "",
    description: row.description?.trim() || "",
    sellerFleetAvailable: false,
    status: isStatus(row.seller_status) ? row.seller_status : "pending",
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason?.trim() || undefined,
    isDemo: row.is_demo === true,
    store_cover_url: row.store_cover_url?.trim() || null,
  }
}

function remember(profile: SellerProfile | null, userId: string) {
  cacheByUserId.set(userId, profile)
  if (adminList && profile) {
    adminList = [...adminList.filter((item) => item.id !== profile.id), profile].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
  } else if (adminList && profile === null) {
    adminList = adminList.filter((item) => item.userId !== userId)
  }
  notifySellerProfilesUpdated()
}

export function isSellerProfilesHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setSellerProfilesHydrated(value: boolean) {
  hydrated = value
  notifySellerProfilesUpdated()
}

export function clearSellerProfileCache() {
  cacheByUserId.clear()
  adminList = null
  hydrated = false
  notifySellerProfilesUpdated()
}

export function peekCachedSellerProfile(userId: string): SellerProfile | null | undefined {
  if (!cacheByUserId.has(userId)) return undefined
  return cacheByUserId.get(userId) ?? null
}

export function peekCachedSellerProfileById(id: string): SellerProfile | null | undefined {
  if (cacheByUserId.has(id)) return cacheByUserId.get(id) ?? null
  if (adminList) return adminList.find((item) => item.id === id) ?? null
  return undefined
}

export function peekCachedSellerProfileList(): SellerProfile[] | null {
  return adminList
}

function writePayload(input: Pick<SellerProfileInput, "businessName" | "businessType" | "nib" | "city" | "showroomAddress" | "phone" | "description">) {
  return {
    business_name: input.businessName.trim(),
    business_type: input.businessType,
    nib: input.nib.replace(/\s/g, ""),
    showroom_name: input.businessName.trim(),
    showroom_address: input.showroomAddress.trim(),
    city: input.city.trim(),
    phone: input.phone.trim(),
    description: input.description.trim(),
  }
}

export async function getMySellerProfile(hints?: OwnerHints): Promise<SellerProfile | null> {
  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throwUserFacing(sessionError, "Unable to verify your session.")
  const userId = sessionData.session?.user.id
  if (!userId) return null

  const { data, error } = await client.from("seller_profiles").select("*").eq("id", userId).maybeSingle()
  if (error) throwUserFacing(error, "Unable to load seller profile.")
  const profile = data
    ? mapSellerProfileRow(data as SellerProfileRow, {
        fullName: hints?.fullName,
        email: hints?.email ?? sessionData.session?.user.email ?? "",
      })
    : null
  remember(profile, userId)
  return profile
}

export async function getSellerProfileById(id: string, hints?: OwnerHints): Promise<SellerProfile | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("seller_profiles")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .maybeSingle()
  if (error) throwUserFacing(error, "Unable to load seller profile.")
  if (!data) {
    remember(null, id)
    return null
  }
  const profile = mapSellerProfileRow(data as SellerProfileRowWithOwner, hints)
  remember(profile, profile.userId)
  return profile
}

export async function listSellerProfilesRemote(): Promise<SellerProfile[]> {
  const client = getSupabaseClient()
  const withOwner = await client.from("seller_profiles").select("*, profiles(full_name)").order("created_at", { ascending: false })
  const result = withOwner.error
    ? await client.from("seller_profiles").select("*").order("created_at", { ascending: false })
    : withOwner
  if (result.error) throwUserFacing(result.error, "Unable to load seller applications.")
  const list = (result.data as SellerProfileRowWithOwner[] | null)?.map((row) => mapSellerProfileRow(row)) ?? []
  adminList = list
  for (const profile of list) cacheByUserId.set(profile.userId, profile)
  notifySellerProfilesUpdated()
  return list
}

export async function getPendingSellerProfiles(): Promise<SellerProfile[]> {
  const list = adminList ?? (await listSellerProfilesRemote())
  return list.filter((item) => item.status === "pending")
}

export async function hydrateSellerProfiles(input: {
  userId: string
  fullName: string
  email: string
  isAdmin: boolean
}) {
  const mine = await getMySellerProfile({ fullName: input.fullName, email: input.email })
  if (input.isAdmin) await listSellerProfilesRemote()
  else if (mine) remember(mine, input.userId)
  hydrated = true
  notifySellerProfilesUpdated()
}

export async function createSellerProfile(input: SellerProfileInput): Promise<SellerProfile> {
  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throwUserFacing(sessionError, "Unable to verify your session.")
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("You must be logged in to register as a seller.")
  if (input.userId !== userId) throw new Error("Seller profile must belong to the signed-in account.")

  const existing = await getMySellerProfile({ fullName: input.fullName, email: input.email })
  if (existing) throw new Error("A seller profile already exists for this account.")

  const { data, error } = await client
    .from("seller_profiles")
    .insert({
      id: userId,
      ...writePayload(input),
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") throw new Error("A seller profile already exists for this account.")
    throwUserFacing(error, "Unable to save seller registration.")
  }

  const profile = mapSellerProfileRow(data as SellerProfileRow, {
    fullName: input.fullName,
    email: input.email,
  })
  remember(profile, userId)
  return profile
}

export async function updateMySellerProfile(
  patch: Partial<
    Pick<
      SellerProfile,
      "businessName" | "businessType" | "nib" | "city" | "showroomAddress" | "phone" | "description" | "store_cover_url"
    >
  >,
): Promise<SellerProfile> {
  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throwUserFacing(sessionError, "Unable to verify your session.")
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("You must be logged in to update your seller profile.")

  const updates: Record<string, string | null> = {}
  if (typeof patch.businessName === "string") {
    updates.business_name = patch.businessName.trim()
    updates.showroom_name = patch.businessName.trim()
  }
  if (typeof patch.businessType === "string") updates.business_type = patch.businessType
  if (typeof patch.nib === "string") updates.nib = patch.nib.replace(/\s/g, "")
  if (typeof patch.city === "string") updates.city = patch.city.trim()
  if (typeof patch.showroomAddress === "string") updates.showroom_address = patch.showroomAddress.trim()
  if (typeof patch.phone === "string") updates.phone = patch.phone.trim()
  if (typeof patch.description === "string") updates.description = patch.description.trim()
  if (patch.store_cover_url !== undefined) {
    const cover = patch.store_cover_url?.trim() || null
    updates.store_cover_url = cover
  }

  if (Object.keys(updates).length === 0) {
    const current = await getMySellerProfile()
    if (!current) throw new Error("Seller profile not found.")
    return current
  }

  const { data, error } = await client.from("seller_profiles").update(updates).eq("id", userId).select("*").single()
  if (error) throwUserFacing(error, "Unable to load seller profile.")
  const { data: session } = await client.auth.getSession()
  const profile = mapSellerProfileRow(data as SellerProfileRow, {
    email: session.session?.user.email ?? "",
  })
  remember(profile, userId)
  return profile
}

export async function resubmitMySellerProfile(input: SellerProfileInput): Promise<SellerProfile> {
  const client = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throwUserFacing(sessionError, "Unable to verify your session.")
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("You must be logged in to register as a seller.")

  const existing = await getMySellerProfile({ fullName: input.fullName, email: input.email })
  if (!existing) return createSellerProfile(input)
  if (existing.status !== "rejected") throw new Error("A seller profile already exists for this account.")

  const { data, error } = await client
    .from("seller_profiles")
    .update({
      ...writePayload(input),
      seller_status: "pending",
      rejection_reason: null,
    })
    .eq("id", userId)
    .select("*")
    .single()
  if (error) throwUserFacing(error, "Unable to load seller profile.")

  const profile = mapSellerProfileRow(data as SellerProfileRow, {
    fullName: input.fullName,
    email: input.email,
  })
  remember(profile, userId)
  return profile
}

export async function approveSellerProfile(id: string): Promise<SellerProfile> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("approve_seller_profile", { target_id: id })
  if (error) throwUserFacing(error, "Unable to load seller profile.")
  const row = (Array.isArray(data) ? data[0] : data) as SellerProfileRow | null
  if (!row) throw new Error("Unable to approve seller.")
  const profile = mapSellerProfileRow(row)
  remember(profile, profile.userId)
  return profile
}

export async function rejectSellerProfile(id: string, reason: string): Promise<SellerProfile> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("reject_seller_profile", {
    target_id: id,
    reason,
  })
  if (error) throwUserFacing(error, "Unable to load seller profile.")
  const row = (Array.isArray(data) ? data[0] : data) as SellerProfileRow | null
  if (!row) throw new Error("Unable to reject seller.")
  const profile = mapSellerProfileRow(row)
  remember(profile, profile.userId)
  return profile
}
