export const MOTORCYCLE_CATEGORIES = [
  "Harley-Davidson",
  "Triumph",
  "Chopper",
  "Bobber",
  "Brat Cafe",
  "Others",
] as const

export type MotorcycleCategory = (typeof MOTORCYCLE_CATEGORIES)[number]

export type HomeListing = {
  id: string
  sellerId: string
  name: string
  brand: string
  model: string
  category: MotorcycleCategory
  price: number
  city: string
  location: string
  image: string | null
  status: string
  isDemo: boolean
  sellerName: string
}

export type HomeGarage = {
  id: string
  businessName: string
  city: string
  coverUrl: string | null
  listingCount: number
  ratingAverage: number | null
  ratingCount: number
}
