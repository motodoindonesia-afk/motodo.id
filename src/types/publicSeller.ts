import type { SellerStatus } from "./seller"

export type PublicSellerProfile = {
  id: string
  userId: string
  businessName: string
  description?: string
  city?: string
  showroomAddress?: string
  phone?: string
  website?: string
  businessHours?: string
  status: SellerStatus
  sellerFleetAvailable: boolean
  createdAt?: string
  store_cover_url: string | null
}

export type PublicSellerSort = "newest" | "price-asc" | "price-desc"
