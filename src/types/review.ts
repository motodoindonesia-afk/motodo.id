export type ReviewStatus = "published" | "hidden"

export type Review = {
  id: string
  orderId: string
  listingId: string
  sellerId: string
  buyerId: string
  rating: number
  title?: string
  comment: string
  createdAt: string
  updatedAt: string
  status: ReviewStatus
  buyerDisplayName?: string
  listingName?: string
}

export type CreateReviewInput = {
  orderId: string
  buyerId: string
  rating: number
  title?: string
  comment: string
}

export type RatingBreakdown = {
  1: number
  2: number
  3: number
  4: number
  5: number
}
