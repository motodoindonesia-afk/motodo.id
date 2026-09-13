export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp —"
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`
}

export function coerceListingQuantity(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim())
  return 1
}

export function formatMileageKm(value: number) {
  return `${Math.round(value).toLocaleString("id-ID")} km`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "M"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}
