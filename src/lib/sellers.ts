import type { MotorcycleCategory, MotorcycleListing as CatalogListing } from "../types/marketplace"
import type { PublicSellerProfile, PublicSellerSort } from "../types/publicSeller"
import type { SellerProfile } from "../types/seller"
import { sortListings } from "./browse"
import { getPublicListings } from "./listings"
import { getSellerOrderCounts } from "./orders"
import { getRatingBreakdown, getSellerRatingSummary, getSellerReviews } from "./reviews"
import { getSellerProfile, getSellerProfileById } from "./seller"

export type { PublicSellerProfile, PublicSellerSort }

export function publicSellerPath(sellerUserId: string) {
  return `/sellers/${sellerUserId}`
}

export function getSellerById(sellerId: string): SellerProfile | null {
  return getSellerProfile(sellerId) ?? getSellerProfileById(sellerId)
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function toPublicSellerProfile(profile: SellerProfile): PublicSellerProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    description: optionalText(profile.description),
    city: optionalText(profile.city),
    showroomAddress: optionalText(profile.showroomAddress),
    phone: optionalText(profile.phone),
    website: optionalText(profile.website),
    businessHours: optionalText(profile.businessHours),
    status: profile.status,
    sellerFleetAvailable: Boolean(profile.sellerFleetAvailable),
    createdAt: profile.createdAt,
  }
}

function catalogFallbackProfile(sellerId: string): PublicSellerProfile | null {
  const listings = getPublicListings().filter((item) => item.sellerId === sellerId)
  if (listings.length === 0) return null
  const seller = listings[0].seller
  return {
    id: sellerId,
    userId: sellerId,
    businessName: seller.name,
    city: optionalText(seller.location),
    status: seller.verified ? "approved" : "pending",
    sellerFleetAvailable: false,
  }
}

export function getPublicSellerProfile(sellerId: string): PublicSellerProfile | null {
  if (!sellerId) return null
  const profile = getSellerById(sellerId)
  if (profile) {
    if (profile.status !== "approved") return null
    return toPublicSellerProfile(profile)
  }
  const fallback = catalogFallbackProfile(sellerId)
  if (!fallback || fallback.status !== "approved") return null
  return fallback
}

export function getSellerActiveListings(sellerId: string): CatalogListing[] {
  const profile = getPublicSellerProfile(sellerId)
  if (!profile || profile.status !== "approved") return []
  return getPublicListings().filter((item) => item.sellerId === profile.userId)
}

export function getSellerCompletedOrders(sellerId: string) {
  const profile = getPublicSellerProfile(sellerId)
  if (!profile) return 0
  return getSellerOrderCounts(profile.userId).completed
}

export function getPublicSellerReviews(sellerId: string) {
  const profile = getPublicSellerProfile(sellerId)
  if (!profile) return []
  return getSellerReviews(profile.userId)
}

export function calculateSellerRating(sellerId: string) {
  const profile = getPublicSellerProfile(sellerId)
  if (!profile) return null
  return getSellerRatingSummary(profile.userId).average
}

export function getPublicSellerRatingBreakdown(sellerId: string) {
  return getRatingBreakdown(getPublicSellerReviews(sellerId))
}

export function filterSellerStoreListings(
  listings: CatalogListing[],
  query: string,
  category: MotorcycleCategory | "All",
) {
  const needle = query.trim().toLowerCase()
  return listings.filter((listing) => {
    if (category !== "All" && listing.category !== category) return false
    if (!needle) return true
    const haystack = `${listing.name} ${listing.brand ?? ""} ${listing.model ?? ""}`.toLowerCase()
    return haystack.includes(needle)
  })
}

export function sortSellerStoreListings(listings: CatalogListing[], sort: PublicSellerSort) {
  return sortListings(listings, sort)
}

export function sellerMemberSinceLabel(profile: PublicSellerProfile) {
  if (profile.createdAt) {
    const year = new Date(profile.createdAt).getFullYear()
    if (!Number.isNaN(year)) return `Member since ${year}`
  }
  return null
}

export function websiteHref(website: string) {
  if (/^https?:\/\//i.test(website)) return website
  return `https://${website}`
}
