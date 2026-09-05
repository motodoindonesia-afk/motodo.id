import type { AuthUser } from "../types/auth"
import { ensureUserExists } from "./auth"

/** Temporary mock admin email. Replace with server-side role-based authorization when Supabase is connected. */
export const MOCK_ADMIN_EMAIL = "admin@motodo.id"

const DEV_ADMIN: AuthUser = {
  id: "mock-admin-motodo",
  fullName: "Motodo Admin",
  email: MOCK_ADMIN_EMAIL,
  role: "buyer",
  createdAt: "2026-01-01T00:00:00.000Z",
}

/**
 * Temporary mock admin authorization. Replace with server-side role-based
 * authorization when Supabase is connected.
 */
export function isAdmin(user: AuthUser | null | undefined) {
  return user?.email.trim().toLowerCase() === MOCK_ADMIN_EMAIL
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
