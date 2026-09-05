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
  status: SellerStatus
  createdAt: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

export type SellerProfileInput = Omit<
  SellerProfile,
  "id" | "status" | "createdAt" | "rejectionReason" | "reviewedAt" | "reviewedBy"
>
