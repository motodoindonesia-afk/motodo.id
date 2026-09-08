/** One cart line. Does not embed Listing. Availability is informational until create_order. */
export type CartItem = {
  id: string
  userId: string
  listingId: string
  quantity: number
  createdAt: string
  updatedAt: string
  listingStatus?: string
  listingIsDemo?: boolean
  availableQuantity?: number
  isAvailable?: boolean
}

export type Cart = {
  items: CartItem[]
}

export type RemoveFromCartResult = {
  listingId: string
  removed: boolean
}
