export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp —"
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`
}

export function coerceListingQuantity(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim())
  return 1
}
