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

export function accountUsername(email: string) {
  const local = email.split("@")[0]?.trim()
  return local ? `@${local}` : "@user"
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`
  return `${local.slice(0, 1)}***${local.slice(-1)}@${domain}`
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 6) return phone ? "••••" : "—"
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`
}

export function nameInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "M"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
