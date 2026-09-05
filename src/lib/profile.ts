import type { UserRole } from "../types/auth"

export function formatMemberSince(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function formatShortDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function roleDescription(role: UserRole) {
  return role === "seller"
    ? "List motorcycles and connect with buyers."
    : "Browse motorcycles, save favorites, and contact sellers."
}
