import type { ListingStatus } from "./listing"

export type { ListingStatus }

export const MOTORCYCLE_CATEGORIES = [
  "Harley-Davidson",
  "Triumph",
  "Chopper",
  "Bobber",
  "Brat Cafe",
  "Others",
] as const

export type MotorcycleCategory = (typeof MOTORCYCLE_CATEGORIES)[number]

export const LOCATION_FILTERS = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Bali",
  "Other",
] as const

export type LocationFilter = (typeof LOCATION_FILTERS)[number]

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "year-desc", label: "Year: Newest" },
  { value: "year-asc", label: "Year: Oldest" },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]["value"]

export type MotorcycleSeller = {
  name: string
  location: string
  memberSince: string
  verified: boolean
}

/**
 * Public catalog DTO for browse/home/detail cards (web presentation).
 * Not the database listing: `price` is formatted text; `priceValue` is the numeric price.
 * Canonical domain listing for mobile reuse is `Listing` in listing.ts (`price: number`).
 */
export type MotorcycleListing = {
  id: string
  sellerId: string
  name: string
  price: string
  priceValue: number
  quantity?: number
  year: number
  location: string
  category: MotorcycleCategory
  image: string
  images: string[]
  mileage: string
  engine: string
  transmission: string
  fuel: string
  color: string
  description: string
  seller: MotorcycleSeller
  listedAt: string
  status?: ListingStatus
  condition?: string
  brand?: string
  model?: string
  isDemo?: boolean
}

export type Category = {
  id: string
  name: string
  variant: "cruiser" | "standard" | "chopper" | "bobber" | "cafe" | "other"
}

export type BrowseFilters = {
  query: string
  categories: MotorcycleCategory[]
  minPrice: string
  maxPrice: string
  minYear: string
  maxYear: string
  locations: LocationFilter[]
}
