import type {
  BrowseFilters,
  LocationFilter,
  MotorcycleListing,
  SortOption,
} from "../types/marketplace"

export const PAGE_SIZE = 9

const MAJOR_CITIES = ["Jakarta", "Bandung", "Surabaya", "Bali"] as const

export function parseOptionalNumber(value: string) {
  const trimmed = value.trim().replace(/[^\d]/g, "")
  if (!trimmed) return undefined
  return Number(trimmed)
}

export function matchesLocation(location: string, selected: LocationFilter[]) {
  if (selected.length === 0) return true

  return selected.some((filter) => {
    if (filter === "Other") {
      return !MAJOR_CITIES.some((city) => location.includes(city))
    }
    return location.includes(filter)
  })
}

export function filterListings(
  listings: MotorcycleListing[],
  filters: BrowseFilters,
) {
  const query = filters.query.trim().toLowerCase()
  const minPrice = parseOptionalNumber(filters.minPrice)
  const maxPrice = parseOptionalNumber(filters.maxPrice)
  const minYear = parseOptionalNumber(filters.minYear)
  const maxYear = parseOptionalNumber(filters.maxYear)

  return listings.filter((listing) => {
    if (query) {
      const haystack = `${listing.name} ${listing.category} ${listing.location}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (filters.categories.length > 0 && !filters.categories.includes(listing.category)) {
      return false
    }

    if (minPrice !== undefined && listing.priceValue < minPrice) return false
    if (maxPrice !== undefined && listing.priceValue > maxPrice) return false
    if (minYear !== undefined && listing.year < minYear) return false
    if (maxYear !== undefined && listing.year > maxYear) return false

    return matchesLocation(listing.location, filters.locations)
  })
}

export function sortListings(listings: MotorcycleListing[], sort: SortOption) {
  const next = [...listings]

  next.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.priceValue - b.priceValue
      case "price-desc":
        return b.priceValue - a.priceValue
      case "year-desc":
        return b.year - a.year
      case "year-asc":
        return a.year - b.year
      case "newest":
      default:
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    }
  })

  return next
}

export function paginateListings(listings: MotorcycleListing[], page: number) {
  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * PAGE_SIZE

  return {
    items: listings.slice(start, start + PAGE_SIZE),
    currentPage,
    totalPages,
    total: listings.length,
  }
}

export function formatMotorcycleCount(count: number) {
  return count === 1 ? "1 motorcycle" : `${count} motorcycles`
}

export const emptyBrowseFilters: BrowseFilters = {
  query: "",
  categories: [],
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  locations: [],
}

export function hasActiveFilters(filters: BrowseFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.categories.length > 0 ||
    filters.minPrice.trim() !== "" ||
    filters.maxPrice.trim() !== "" ||
    filters.minYear.trim() !== "" ||
    filters.maxYear.trim() !== "" ||
    filters.locations.length > 0
  )
}
