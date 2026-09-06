import type { CreateReviewInput, RatingBreakdown, Review, ReviewStatus } from "../types/review"
import { getUserById } from "./auth"
import { getOrderById } from "./orders"
import { userFacingMessage } from "./userFacingError"
import { isSupabaseConfigured } from "./supabase"
import {
  createReviewRemote,
  isReviewsHydrated,
  peekCachedReview,
  peekCachedReviewByOrder,
  peekCachedReviews,
  peekListingRatingSummary,
  peekSellerRatingSummary,
  setReviewStatusRemote,
} from "./reviewsSupabase"

export type { Review, CreateReviewInput, RatingBreakdown } from "../types/review"

export const REVIEWS_STORAGE_KEY = "motodo_reviews"
export const REVIEWS_UPDATED_EVENT = "motodo:reviews-updated"

export const MIN_REVIEW_COMMENT = 5
export const MAX_REVIEW_COMMENT = 1000

export function isReviewsReady() {
  return isReviewsHydrated()
}

export class ReviewError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReviewError"
  }
}

function notifyReviewsUpdated() {
  window.dispatchEvent(new Event(REVIEWS_UPDATED_EVENT))
}

function isRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5
}

function isStatus(value: unknown): value is ReviewStatus {
  return value === "published" || value === "hidden"
}

export function normalizeReview(value: Partial<Review>): Review | null {
  if (!value.id || !value.orderId || !value.listingId || !value.sellerId || !value.buyerId) return null
  if (!isRating(value.rating) || typeof value.comment !== "string") return null
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null
  const comment = value.comment.trim()
  if (!comment) return null
  return {
    id: value.id,
    orderId: value.orderId,
    listingId: value.listingId,
    sellerId: value.sellerId,
    buyerId: value.buyerId,
    rating: value.rating,
    title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : undefined,
    comment,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    status: isStatus(value.status) ? value.status : "published",
    buyerDisplayName: typeof value.buyerDisplayName === "string" ? value.buyerDisplayName : undefined,
    listingName: typeof value.listingName === "string" ? value.listingName : undefined,
  }
}

function readReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Review>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const review = normalizeReview(item)
      return review ? [review] : []
    })
  } catch {
    return []
  }
}

function writeReviews(reviews: Review[]) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  notifyReviewsUpdated()
}

function sortNewest(reviews: Review[]) {
  return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function published(reviews: Review[]) {
  return reviews.filter((item) => item.status === "published")
}

export function getReviews(): Review[] {
  if (isSupabaseConfigured()) return sortNewest(published(peekCachedReviews()))
  return sortNewest(published(readReviews()))
}

export function getAllReviews(): Review[] {
  if (isSupabaseConfigured()) return sortNewest(peekCachedReviews())
  return sortNewest(readReviews())
}

export function getReviewById(id: string): Review | null {
  if (isSupabaseConfigured()) return peekCachedReview(id) ?? null
  return readReviews().find((item) => item.id === id) ?? null
}

export async function setReviewStatus(reviewId: string, status: ReviewStatus): Promise<Review | null> {
  if (isSupabaseConfigured()) {
    try {
      return await setReviewStatusRemote(reviewId, status)
    } catch {
      return null
    }
  }
  const current = readReviews().find((item) => item.id === reviewId)
  if (!current) return null
  const next: Review = {
    ...current,
    buyerId: current.buyerId,
    sellerId: current.sellerId,
    orderId: current.orderId,
    listingId: current.listingId,
    status,
    updatedAt: new Date().toISOString(),
  }
  writeReviews(readReviews().map((item) => (item.id === reviewId ? next : item)))
  return next
}

export function getReviewByOrderId(orderId: string): Review | null {
  if (isSupabaseConfigured()) return peekCachedReviewByOrder(orderId) ?? null
  return readReviews().find((item) => item.orderId === orderId) ?? null
}

export function hasReviewedOrder(orderId: string) {
  return getReviewByOrderId(orderId) !== null
}

export function getListingReviews(listingId: string): Review[] {
  return getReviews().filter((item) => item.listingId === listingId)
}

export function getSellerReviews(sellerId: string): Review[] {
  return getReviews().filter((item) => item.sellerId === sellerId)
}

export function calculateAverageRating(reviews: Review[]): number | null {
  const list = published(reviews)
  if (list.length === 0) return null
  const sum = list.reduce((total, item) => total + item.rating, 0)
  return Math.round((sum / list.length) * 10) / 10
}

export function calculateListingRating(reviews: Review[]) {
  return calculateAverageRating(reviews)
}

export function getRatingBreakdown(reviews: Review[]): RatingBreakdown {
  const list = published(reviews)
  const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const item of list) {
    const star = item.rating
    if (star === 1 || star === 2 || star === 3 || star === 4 || star === 5) breakdown[star] += 1
  }
  return breakdown
}

export function formatAverageRating(value: number | null) {
  if (value === null) return null
  return value.toFixed(1)
}

export function formatReviewerDisplayName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Buyer"
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`
}

export function getReviewerDisplayName(buyerId: string, snapshotName?: string) {
  if (snapshotName?.trim()) return formatReviewerDisplayName(snapshotName)
  const user = getUserById(buyerId)
  return formatReviewerDisplayName(user?.fullName ?? "Buyer")
}

export function getReviewPublicName(review: Review) {
  return getReviewerDisplayName(review.buyerId, review.buyerDisplayName)
}

export function getListingRatingSummary(listingId: string) {
  if (isSupabaseConfigured()) {
    const summary = peekListingRatingSummary(listingId)
    if (summary) return summary
  }
  const reviews = getListingReviews(listingId)
  return { average: calculateAverageRating(reviews), count: reviews.length }
}

export function getSellerRatingSummary(sellerId: string) {
  if (isSupabaseConfigured()) {
    const summary = peekSellerRatingSummary(sellerId)
    if (summary) return summary
  }
  const reviews = getSellerReviews(sellerId)
  return { average: calculateAverageRating(reviews), count: reviews.length }
}

export function formatReviewMonth(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function ratingLabel(rating: number) {
  if (rating === 1) return "1 Star"
  return `${rating} Stars`
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  if (isSupabaseConfigured()) {
    try {
      return await createReviewRemote({
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
      })
    } catch (error) {
      throw new ReviewError(userFacingMessage(error, "Unable to submit review."))
    }
  }

  const buyer = getUserById(input.buyerId)
  if (!buyer) throw new ReviewError("You must be logged in to leave a review.")

  const order = getOrderById(input.orderId)
  if (!order) throw new ReviewError("Order not found.")
  if (order.buyerId !== input.buyerId) throw new ReviewError("You don't have permission to review this order.")
  if (order.status !== "completed") throw new ReviewError("You can only review a completed order.")
  if (hasReviewedOrder(order.id)) throw new ReviewError("You have already reviewed this order.")

  if (!isRating(input.rating)) throw new ReviewError("Select a rating from 1 to 5 stars.")

  const comment = input.comment.trim()
  if (!comment) throw new ReviewError("Comment is required.")
  if (comment.length < MIN_REVIEW_COMMENT) throw new ReviewError("Comment must be at least 5 characters.")
  if (comment.length > MAX_REVIEW_COMMENT) throw new ReviewError("Comment must be 1000 characters or fewer.")

  const now = new Date().toISOString()
  const review: Review = {
    id: crypto.randomUUID(),
    orderId: order.id,
    listingId: order.listingId,
    sellerId: order.sellerId,
    buyerId: order.buyerId,
    rating: input.rating,
    title: input.title?.trim() || undefined,
    comment,
    createdAt: now,
    updatedAt: now,
    status: "published",
  }
  writeReviews([review, ...readReviews()])
  return review
}

export function subscribeReviewUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === REVIEWS_STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(REVIEWS_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(REVIEWS_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}
