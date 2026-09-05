import { MOTORCYCLE_CATEGORIES, type MotorcycleCategory } from "../types/marketplace"
import type { SellerProfile } from "../types/seller"
import {
  LISTING_CITIES,
  LISTING_CONDITIONS,
  LISTING_FUELS,
  LISTING_TRANSMISSIONS,
  type ListingCondition,
  type ListingFuel,
  type ListingTransmission,
  type MotorcycleListing,
  type MotorcycleListingInput,
} from "../types/sellerListing"

export type ListingFormValues = {
  name: string
  category: MotorcycleCategory | ""
  brand: string
  model: string
  price: string
  quantity: string
  condition: ListingCondition | ""
  year: string
  mileage: string
  engine: string
  transmission: ListingTransmission | ""
  fuel: ListingFuel | ""
  color: string
  city: string
  location: string
  showroomAddress: string
  description: string
  images: string[]
}

export type ListingFormErrors = Partial<Record<keyof ListingFormValues, string>> & { form?: string }

const currentYear = new Date().getFullYear()

export function emptyListingForm(profile?: SellerProfile | null, listing?: MotorcycleListing | null): ListingFormValues {
  return {
    name: listing?.name ?? "",
    category: listing?.category ?? "",
    brand: listing?.brand ?? "",
    model: listing?.model ?? "",
    price: listing?.price ? String(listing.price) : "",
    quantity: String(listing?.quantity && listing.quantity >= 1 ? listing.quantity : 1),
    condition: listing?.condition ?? "",
    year: listing?.year ? String(listing.year) : "",
    mileage: listing ? String(listing.mileage) : "",
    engine: listing?.engine ?? "",
    transmission: listing?.transmission || "Manual",
    fuel: listing?.fuel || "Petrol",
    color: listing?.color ?? "",
    city: listing?.city || profile?.city || "",
    location: listing?.location ?? "",
    showroomAddress: listing?.showroomAddress || profile?.showroomAddress || "",
    description: listing?.description ?? "",
    images: listing?.images ? [...listing.images] : [],
  }
}

export function parsePriceInput(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  if (!digits) return NaN
  return Number(digits)
}

export function parseQuantityInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return NaN
  return Number(trimmed)
}

export function normalizeQuantity(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return value
  if (typeof value === "string") {
    const parsed = parseQuantityInput(value)
    if (Number.isInteger(parsed) && parsed >= 1) return parsed
  }
  return 1
}

export function formatAvailableQuantity(quantity?: number) {
  const units = normalizeQuantity(quantity)
  return units === 1 ? "Available: 1 unit" : `Available: ${units} units`
}

export function formatIDR(value: number) {
  if (!Number.isFinite(value)) return "Rp —"
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`
}

export function formatMileageKm(value: number) {
  return `${Math.round(value).toLocaleString("id-ID")} km`
}

function isCategory(value: string): value is MotorcycleCategory {
  return (MOTORCYCLE_CATEGORIES as readonly string[]).includes(value)
}

function isCondition(value: string): value is ListingCondition {
  return (LISTING_CONDITIONS as readonly string[]).includes(value)
}

function isTransmission(value: string): value is ListingTransmission {
  return (LISTING_TRANSMISSIONS as readonly string[]).includes(value)
}

function isFuel(value: string): value is ListingFuel {
  return (LISTING_FUELS as readonly string[]).includes(value)
}

export function validateListingForm(values: ListingFormValues, options?: { requireImages?: boolean }): ListingFormErrors {
  const errors: ListingFormErrors = {}
  const year = Number(values.year)
  const mileage = Number(values.mileage.replace(/[^\d]/g, ""))
  const price = parsePriceInput(values.price)

  if (!values.name.trim()) errors.name = "Motorcycle name is required."
  if (!values.category || !isCategory(values.category)) errors.category = "Select a category."
  if (!values.brand.trim()) errors.brand = "Brand is required."
  if (!values.model.trim()) errors.model = "Model is required."
  if (!values.price.trim()) errors.price = "Price is required."
  else if (!Number.isFinite(price) || price <= 0) errors.price = "Enter a price greater than 0."
  const quantity = parseQuantityInput(values.quantity)
  if (!values.quantity.trim()) errors.quantity = "Quantity is required."
  else if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = "Enter a whole number of 1 or more."
  }
  if (!values.condition || !isCondition(values.condition)) errors.condition = "Select a condition."
  if (!values.year.trim()) errors.year = "Year is required."
  else if (!Number.isInteger(year) || year < 1950 || year > currentYear + 1) {
    errors.year = `Enter a year between 1950 and ${currentYear + 1}.`
  }
  if (!values.mileage.trim()) errors.mileage = "Mileage is required."
  else if (!Number.isFinite(mileage) || mileage < 0) errors.mileage = "Enter mileage in kilometers."
  if (!values.engine.trim()) errors.engine = "Engine is required."
  if (!values.transmission || !isTransmission(values.transmission)) {
    errors.transmission = "Select a transmission."
  }
  if (!values.fuel || !isFuel(values.fuel)) errors.fuel = "Select a fuel type."
  if (!values.color.trim()) errors.color = "Color is required."
  if (!values.city.trim()) errors.city = "City is required."
  if (!values.location.trim()) errors.location = "Location / area is required."
  if (!values.showroomAddress.trim()) errors.showroomAddress = "Showroom address is required."
  if (!values.description.trim()) errors.description = "Description is required."
  else if (values.description.trim().length < 40) {
    errors.description = "Add more detail so buyers understand the motorcycle."
  }
  if (options?.requireImages !== false && values.images.length < 1) {
    errors.images = "Add at least one photo. The first photo is the cover image."
  }
  if (values.images.length > 10) errors.images = "You can add up to 10 photos."

  return errors
}

export function valuesToListingInput(
  values: ListingFormValues,
  sellerId: string,
  status: MotorcycleListing["status"],
): MotorcycleListingInput {
  const category = isCategory(values.category) ? values.category : "Others"
  return {
    sellerId,
    name: values.name.trim(),
    brand: values.brand.trim(),
    model: values.model.trim(),
    category,
    price: parsePriceInput(values.price) || 0,
    quantity: normalizeQuantity(values.quantity),
    condition: isCondition(values.condition) ? values.condition : "",
    year: Number(values.year) || 0,
    mileage: Number(values.mileage.replace(/[^\d]/g, "")) || 0,
    engine: values.engine.trim(),
    transmission: isTransmission(values.transmission) ? values.transmission : "",
    fuel: isFuel(values.fuel) ? values.fuel : "",
    color: values.color.trim(),
    city: values.city.trim(),
    location: values.location.trim(),
    showroomAddress: values.showroomAddress.trim(),
    description: values.description.trim(),
    images: values.images.slice(0, 10),
    status,
  }
}

export { LISTING_CITIES, LISTING_CONDITIONS, LISTING_FUELS, LISTING_TRANSMISSIONS }
export { MOTORCYCLE_CATEGORIES }
