import type { AuthUser } from "../types/auth"
import type { Order } from "../types/order"
import type { Review } from "../types/review"
import type { SellerProfile } from "../types/seller"
import { isAdmin } from "./admin"
import { listUsers, getUserById as getMockUserById } from "./auth"
import { isSupabaseConfigured } from "./supabase"
import { peekCachedAdminUser, peekCachedAdminUsers } from "./adminUsersSupabase"
import { formatIDR } from "./listingForm"
import {
  getListingById,
  getSellerListingCounts,
  getSellerLowInventoryListings,
  listAllListingsForAdmin,
} from "./listings"
import { getBuyerOrders, getOrders, getSellerOrderCounts, getSellerOrders, orderPublicRef } from "./orders"
import { calculateAverageRating, formatAverageRating, getAllReviews, getReviewPublicName } from "./reviews"
import { getSellerProfile, getSellerStats, listSellerProfiles } from "./seller"

export type PlatformRole = "Admin" | "Seller" | "Buyer"

export type PlatformRevenue = {
  grossTransactionValue: number
  motodoSuccessFee: number
  sellerNetAmount: number
  orderCount: number
}

export type AdminActivity = {
  id: string
  label: string
  at: string
  href: string
}

function revenueOrders(orders: Order[]) {
  return orders.filter((item) => item.status === "confirmed" || item.status === "completed")
}

export function getOrderRevenueTotals(orders: Order[]): PlatformRevenue {
  const valid = revenueOrders(orders)
  return {
    grossTransactionValue: valid.reduce((sum, item) => sum + item.buyerTotal, 0),
    motodoSuccessFee: valid.reduce((sum, item) => sum + item.sellerSuccessFeeAmount, 0),
    sellerNetAmount: valid.reduce((sum, item) => sum + item.sellerNetAmount, 0),
    orderCount: valid.length,
  }
}

export function getAllUsers(): AuthUser[] {
  if (isSupabaseConfigured()) return peekCachedAdminUsers()
  return listUsers()
}

export function getAdminDirectoryUser(id: string): AuthUser | null {
  if (isSupabaseConfigured()) return peekCachedAdminUser(id)
  return getMockUserById(id)
}

export function getAllSellers(): SellerProfile[] {
  return listSellerProfiles()
}

export function getAllListings() {
  return listAllListingsForAdmin()
}

export function getAllOrders(): Order[] {
  return getOrders()
}

export function getAllAdminReviews(): Review[] {
  return getAllReviews()
}

export function getPendingSellerCount() {
  return getSellerStats().pending
}

export function getPlatformRevenue() {
  return getOrderRevenueTotals(getOrders())
}

export function getSellerRevenue(sellerUserId: string) {
  return getOrderRevenueTotals(getSellerOrders(sellerUserId))
}

export function platformRole(user: AuthUser): PlatformRole {
  if (isAdmin(user)) return "Admin"
  if (getSellerProfile(user.id) || user.role === "seller") return "Seller"
  return "Buyer"
}

export function accountTypeLabel(user: AuthUser) {
  return user.role === "seller" ? "Seller" : "Buyer"
}

export function privilegeLabel(user: AuthUser) {
  return user.privilege === "admin" ? "Admin" : "User"
}

export function accountStatusLabel() {
  return "Active"
}

export function getPlatformStats() {
  const users = getAllUsers()
  const sellers = getSellerStats()
  const listings = getAllListings()
  const orders = getOrders()
  const revenue = getOrderRevenueTotals(orders)
  const listingCounts = {
    total: listings.length,
    active: listings.filter((item) => item.status === "active").length,
    draft: listings.filter((item) => item.status === "draft").length,
    sold: listings.filter((item) => item.status === "sold").length,
  }
  const orderCounts = {
    total: orders.length,
    pending: orders.filter((item) => item.status === "pending").length,
    confirmed: orders.filter((item) => item.status === "confirmed").length,
    completed: orders.filter((item) => item.status === "completed").length,
    cancelled: orders.filter((item) => item.status === "cancelled").length,
  }
  return {
    totalUsers: users.length,
    totalSellers: sellers.total,
    approvedSellers: sellers.approved,
    pendingSellers: sellers.pending,
    rejectedSellers: sellers.rejected,
    totalListings: listingCounts.total,
    activeListings: listingCounts.active,
    draftListings: listingCounts.draft,
    soldListings: listingCounts.sold,
    totalOrders: orderCounts.total,
    pendingOrders: orderCounts.pending,
    confirmedOrders: orderCounts.confirmed,
    completedOrders: orderCounts.completed,
    cancelledOrders: orderCounts.cancelled,
    ...revenue,
  }
}

export function getLowInventoryCount() {
  const sellers = listSellerProfiles()
  const seen = new Set<string>()
  let count = 0
  for (const seller of sellers) {
    for (const listing of getSellerLowInventoryListings(seller.userId)) {
      if (seen.has(listing.id)) continue
      seen.add(listing.id)
      count += 1
    }
  }
  return count
}

export function getNewReviewCount(withinMs = 7 * 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - withinMs
  return getAllReviews().filter((item) => new Date(item.createdAt).getTime() >= cutoff).length
}

export function getActionRequired() {
  const pendingSellers = getPendingSellerCount()
  const pendingOrders = getOrders().filter((item) => item.status === "pending").length
  const lowInventory = getLowInventoryCount()
  const newReviews = getNewReviewCount()
  return [
    pendingSellers > 0
      ? {
          id: "pending-sellers",
          label: `${pendingSellers} ${pendingSellers === 1 ? "seller" : "sellers"} waiting for verification`,
          href: "/sellers?status=pending",
        }
      : null,
    pendingOrders > 0
      ? {
          id: "pending-orders",
          label: `${pendingOrders} pending ${pendingOrders === 1 ? "order" : "orders"}`,
          href: "/orders?status=pending",
        }
      : null,
    lowInventory > 0
      ? {
          id: "low-inventory",
          label: `${lowInventory} low inventory ${lowInventory === 1 ? "listing" : "listings"}`,
          href: "/listings?status=active",
        }
      : null,
    newReviews > 0
      ? {
          id: "new-reviews",
          label: `${newReviews} new ${newReviews === 1 ? "review" : "reviews"}`,
          href: "/reviews",
        }
      : null,
  ].filter((item): item is { id: string; label: string; href: string } => item !== null)
}

export function getRecentActivity(limit = 12): AdminActivity[] {
  const events: AdminActivity[] = []

  for (const seller of listSellerProfiles()) {
    events.push({
      id: `seller-${seller.id}`,
      label: `New seller registered: ${seller.businessName}`,
      at: seller.createdAt,
      href: `/sellers/${seller.id}`,
    })
  }

  for (const order of getOrders()) {
    events.push({
      id: `order-new-${order.id}`,
      label: `New order created for ${order.listingName}`,
      at: order.createdAt,
      href: `/orders/${orderPublicRef(order)}`,
    })
    if (order.status === "completed") {
      events.push({
        id: `order-done-${order.id}`,
        label: `Order completed for ${order.listingName}`,
        at: order.updatedAt,
        href: `/orders/${orderPublicRef(order)}`,
      })
    }
  }

  for (const listing of getAllListings()) {
    events.push({
      id: `listing-${listing.id}`,
      label: `Listing created: ${listing.name}`,
      at: listing.createdAt,
      href: `/listings/${listing.id}`,
    })
  }

  for (const review of getAllReviews()) {
    events.push({
      id: `review-${review.id}`,
      label: `Review submitted for ${getOrderByListingName(review.orderId, review.listingId)}`,
      at: review.createdAt,
      href: `/reviews/${review.id}`,
    })
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}

function getOrderByListingName(orderId: string, listingId: string) {
  return getOrders().find((item) => item.id === orderId)?.listingName ?? getListingById(listingId)?.name ?? "a motorcycle"
}

export function sellerRowStats(seller: SellerProfile) {
  const listings = getSellerListingCounts(seller.userId)
  const orders = getSellerOrderCounts(seller.userId)
  const reviews = getAllReviews().filter((item) => item.sellerId === seller.userId && item.status === "published")
  return {
    activeListings: listings.active,
    soldListings: listings.sold,
    orders: orders.total,
    completed: orders.completed,
    rating: formatAverageRating(calculateAverageRating(reviews)),
    reviews: reviews.length,
  }
}

export function formatMoney(value: number) {
  return formatIDR(value)
}

export function reviewMotorcycleName(review: Review) {
  return getOrders().find((item) => item.id === review.orderId)?.listingName ?? getListingById(review.listingId)?.name ?? "—"
}

export function reviewBuyerName(review: Review) {
  return getReviewPublicName(review)
}

export function sellerBusinessName(sellerUserId: string) {
  return getSellerProfile(sellerUserId)?.businessName ?? "Seller"
}

export function buyerOrderCount(userId: string) {
  return getBuyerOrders(userId).length
}
