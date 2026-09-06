import type { AuthUser } from "../types/auth"
import { ensureUserExists } from "./auth"
import { isMockMarketplaceAllowed, isSupabaseConfigured } from "./supabase"

/** Mock admin identity for localStorage QA only. Not used when Supabase Auth is configured. */
export const MOCK_ADMIN_EMAIL = "admin@motodo.id"
export const MOCK_ADMIN_USER_ID = "mock-admin-motodo"

const DEV_ADMIN: AuthUser = {
  id: MOCK_ADMIN_USER_ID,
  fullName: "Motodo Admin",
  email: MOCK_ADMIN_EMAIL,
  role: "buyer",
  privilege: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
}

/**
 * Mock: email match (localStorage only).
 * Supabase: profiles.role === admin via AuthUser.privilege — never email.
 */
export function isAdmin(user: AuthUser | null | undefined) {
  if (!user) return false
  if (isSupabaseConfigured()) return user.privilege === "admin"
  if (!isMockMarketplaceAllowed()) return user.privilege === "admin"
  return user.email.trim().toLowerCase() === MOCK_ADMIN_EMAIL
}

/**
 * Temporary mock admin authorization. Replace with server-side role-based
 * authorization when Supabase is connected.
 */
export function requireAdmin(user: AuthUser | null | undefined) {
  return isAdmin(user)
}

export function ensureDevAdminUser() {
  ensureUserExists(DEV_ADMIN)
}
