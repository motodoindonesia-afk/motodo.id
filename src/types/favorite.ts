/** Canonical wishlist row. Does not embed Listing. */
export type Favorite = {
  id: string
  userId: string
  listingId: string
  createdAt: string
}

export type ToggleFavoriteResult = {
  listingId: string
  favorited: boolean
}
