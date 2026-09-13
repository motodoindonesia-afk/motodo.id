import type { RatingBreakdown, Review, ReviewStatus } from "../types/review"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"
import { notifyWebCache } from "./webCacheNotify"

const REVIEWS_UPDATED_EVENT = "motodo:reviews-updated"

type ReviewRow = {
  id: string
  order_id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  rating: number
  title: string | null
  body: string | null
  status: string
  order_number: string
  listing_name: string | null
  buyer_display_name: string | null
  created_at: string
  updated_at: string
}

type RatingSummaryRow = {
  listing_id?: string
  seller_id?: string
  review_count: number
  average_rating: number | string | null
}

export type RatingSummary = {
  average: number | null
  count: number
}

const reviewCache = new Map<string, Review>()
const reviewByOrder = new Map<string, string>()
const listingRatings = new Map<string, RatingSummary>()
const sellerRatings = new Map<string, RatingSummary>()
let hydrated = false

function notifyReviewsUpdated() {
  notifyWebCache(REVIEWS_UPDATED_EVENT)
}

export function isReviewsHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setReviewsHydrated(value: boolean) {
  hydrated = value
  notifyReviewsUpdated()
}

export function clearReviewCache() {
  reviewCache.clear()
  reviewByOrder.clear()
  listingRatings.clear()
  sellerRatings.clear()
  hydrated = false
  notifyReviewsUpdated()
}

export function peekCachedReviews(): Review[] {
  return [...reviewCache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function peekCachedReview(id: string): Review | undefined {
  return reviewCache.get(id)
}

export function peekCachedReviewByOrder(orderRef: string): Review | undefined {
  const id = reviewByOrder.get(orderRef)
  return id ? reviewCache.get(id) : undefined
}

export function peekListingRatingSummary(listingId: string): RatingSummary | undefined {
  return listingRatings.get(listingId)
}

export function peekSellerRatingSummary(sellerId: string): RatingSummary | undefined {
  return sellerRatings.get(sellerId)
}

function isStatus(value: string): value is ReviewStatus {
  return value === "published" || value === "hidden"
}

export function mapReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    listingId: row.listing_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    rating: row.rating,
    title: row.title?.trim() || undefined,
    comment: row.body ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: isStatus(row.status) ? row.status : "published",
    buyerDisplayName: row.buyer_display_name ?? undefined,
    listingName: row.listing_name ?? undefined,
  }
}

function rememberReview(review: Review) {
  reviewCache.set(review.id, review)
  reviewByOrder.set(review.orderId, review.id)
  if (review.orderNumber) reviewByOrder.set(review.orderNumber, review.id)
  notifyReviewsUpdated()
}

function asReviewRow(data: unknown): ReviewRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as ReviewRow
}

function asReviewRows(data: unknown): ReviewRow[] {
  return Array.isArray(data) ? (data as ReviewRow[]) : []
}

function mapSummary(count: number, average: number | string | null): RatingSummary {
  const n = typeof average === "string" ? Number(average) : average
  return {
    count: Math.max(0, Number(count) || 0),
    average: count > 0 && Number.isFinite(n) ? n : null,
  }
}

export async function refreshRatingSummaries() {
  const client = getSupabaseClient()
  const [listings, sellers] = await Promise.all([
    client.from("listing_rating_summary").select("listing_id, review_count, average_rating"),
    client.from("seller_rating_summary").select("seller_id, review_count, average_rating"),
  ])
  listingRatings.clear()
  for (const row of (listings.data as RatingSummaryRow[] | null) ?? []) {
    if (row.listing_id) listingRatings.set(row.listing_id, mapSummary(row.review_count, row.average_rating))
  }
  sellerRatings.clear()
  for (const row of (sellers.data as RatingSummaryRow[] | null) ?? []) {
    if (row.seller_id) sellerRatings.set(row.seller_id, mapSummary(row.review_count, row.average_rating))
  }
  notifyReviewsUpdated()
}

export async function hydrateReviews() {
  const client = getSupabaseClient()
  const { data, error } = await client.from("reviews").select("*").order("created_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load reviews.")
  reviewCache.clear()
  reviewByOrder.clear()
  for (const row of asReviewRows(data)) {
    const review = mapReviewRow(row)
    reviewCache.set(review.id, review)
    reviewByOrder.set(review.orderId, review.id)
  }
  await refreshRatingSummaries()
  hydrated = true
  notifyReviewsUpdated()
}

export async function createReviewRemote(input: {
  orderId: string
  rating: number
  title?: string
  comment: string
}): Promise<Review> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("create_review", {
    p_order_ref: input.orderId,
    p_rating: input.rating,
    p_title: input.title ?? null,
    p_body: input.comment,
  })
  if (error) throwUserFacing(error, "Unable to load reviews.")
  const row = asReviewRow(data) ?? asReviewRows(data)[0]
  if (!row) throw new Error("Unable to submit review.")
  const review = mapReviewRow(row)
  rememberReview(review)
  await refreshRatingSummaries()
  return review
}

export async function setReviewStatusRemote(reviewId: string, status: ReviewStatus): Promise<Review> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("set_review_status", {
    p_review_id: reviewId,
    p_status: status,
  })
  if (error) throwUserFacing(error, "Unable to load reviews.")
  const row = asReviewRow(data) ?? asReviewRows(data)[0]
  if (!row) throw new Error("Review not found.")
  const review = mapReviewRow(row)
  rememberReview(review)
  await refreshRatingSummaries()
  return review
}

export function getRatingBreakdownFromReviews(reviews: Review[]): RatingBreakdown {
  const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const item of reviews) {
    const star = item.rating
    if (star === 1 || star === 2 || star === 3 || star === 4 || star === 5) breakdown[star] += 1
  }
  return breakdown
}
