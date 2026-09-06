export const BUSINESS_TYPES = [
  "Custom Garage",
  "Motorcycle Dealer",
  "Motorcycle Workshop",
  "Motorcycle Dealership",
  "Other",
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]

export type SellerStatus = "pending" | "approved" | "rejected"

export type SellerProfile = {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  businessName: string
  businessType: BusinessType
  nib: string
  yearEstablished: number
  city: string
  showroomAddress: string
  postalCode: string
  instagram?: string
  website?: string
  description: string
  businessHours?: string
  sellerFleetAvailable: boolean
  status: SellerStatus
  createdAt: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
  isDemo?: boolean
}

export type SellerProfileInput = Omit<
  SellerProfile,
  "id" | "status" | "createdAt" | "rejectionReason" | "reviewedAt" | "reviewedBy" | "isDemo"
>
