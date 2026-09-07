import type { MotorcycleCategory } from "./marketplace"

export const LISTING_CONDITIONS = ["Excellent", "Very Good", "Good", "Needs Work"] as const
export type ListingCondition = (typeof LISTING_CONDITIONS)[number]

export const LISTING_CITIES = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Bali",
  "Yogyakarta",
  "Medan",
  "Other",
] as const
export type ListingCity = (typeof LISTING_CITIES)[number]

export const LISTING_TRANSMISSIONS = ["Manual", "Automatic"] as const
export type ListingTransmission = (typeof LISTING_TRANSMISSIONS)[number]

export const LISTING_FUELS = ["Petrol"] as const
export type ListingFuel = (typeof LISTING_FUELS)[number]

export const LISTING_STATUSES = ["draft", "active", "sold"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

/**
 * Canonical Motodo listing (database / domain).
 * `price` is a number. `id` is the listings UUID.
 * Public browse cards use MotorcycleListing in marketplace.ts (formatted catalog DTO).
 */
export type Listing = {
  id: string
  sellerId: string
  name: string
  brand: string
  model: string
  category: MotorcycleCategory
  price: number
  quantity: number
  condition: ListingCondition | ""
  year: number
  mileage: number
  engine: string
  transmission: ListingTransmission | ""
  fuel: ListingFuel | ""
  color: string
  city: string
  location: string
  showroomAddress: string
  description: string
  images: string[]
  status: ListingStatus
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type ListingInput = Omit<Listing, "id" | "createdAt" | "updatedAt" | "isDemo">
