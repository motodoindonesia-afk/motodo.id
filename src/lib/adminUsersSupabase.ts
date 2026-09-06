import type { AuthUser, UserRole } from "../types/auth"
import type { PrivilegeRole } from "../types/profile"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

const ADMIN_USERS_UPDATED_EVENT = "motodo:admin-users-updated"

type ProfileDirectoryRow = {
  id: string
  full_name: string
  account_type: string
  role: string
  created_at: string
  updated_at: string
}

const cache = new Map<string, AuthUser>()
let hydrated = false

function isAccountType(value: string): value is UserRole {
  return value === "buyer" || value === "seller"
}

function isPrivilege(value: string): value is PrivilegeRole {
  return value === "user" || value === "admin"
}

function mapProfileRowToAuthUser(row: ProfileDirectoryRow): AuthUser | null {
  if (!row.id || !row.full_name) return null
  return {
    id: row.id,
    fullName: row.full_name,
    email: "",
    role: isAccountType(row.account_type) ? row.account_type : "buyer",
    privilege: isPrivilege(row.role) ? row.role : "user",
    createdAt: row.created_at,
  }
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_USERS_UPDATED_EVENT))
  }
}

export function isAdminUsersHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setAdminUsersHydrated(value: boolean) {
  hydrated = value
  notifyUpdated()
}

export function clearAdminUsersCache() {
  cache.clear()
  hydrated = false
  notifyUpdated()
}

export function peekCachedAdminUsers(): AuthUser[] {
  return [...cache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function peekCachedAdminUser(id: string): AuthUser | null {
  return cache.get(id) ?? null
}

function asRows(data: unknown): ProfileDirectoryRow[] {
  return Array.isArray(data) ? (data as ProfileDirectoryRow[]) : []
}

export async function hydrateAdminUsers() {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, account_type, role, created_at, updated_at")
    .order("created_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load users.")
  cache.clear()
  for (const row of asRows(data)) {
    const user = mapProfileRowToAuthUser(row)
    if (user) cache.set(user.id, user)
  }
  hydrated = true
  notifyUpdated()
}

export async function fetchAdminUser(id: string): Promise<AuthUser | null> {
  const cached = cache.get(id)
  if (cached) return cached
  const client = getSupabaseClient()
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, account_type, role, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) throwUserFacing(error, "Unable to load this user.")
  if (!data) return null
  const user = mapProfileRowToAuthUser(data as ProfileDirectoryRow)
  if (user) cache.set(user.id, user)
  notifyUpdated()
  return user
}

export function subscribeAdminUsersUpdates(onChange: () => void) {
  window.addEventListener(ADMIN_USERS_UPDATED_EVENT, onChange)
  return () => window.removeEventListener(ADMIN_USERS_UPDATED_EVENT, onChange)
}
