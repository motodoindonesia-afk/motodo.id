export const SELLER_SUCCESS_FEE_RATE = 0.02

export type DeliveryMethod = "pickup" | "seller_fleet" | "third_party"
export type DiscountType = "percentage" | "fixed"
export type PaymentMethod = "bank_transfer" | "discuss_with_seller"
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type Order = {
  /** Database primary key (orders.id). */
  id: string
  /** Human-readable MTD-XXXXXXXX (orders.order_number). Used in web URLs. */
  orderNumber: string
  listingId: string
  sellerId: string
  buyerId: string
  listingName: string
  listingImage?: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  unitPrice: number
  quantity: number
  subtotal: number
  discountType?: DiscountType
  discountValue?: number
  discountAmount: number
  buyerTotal: number
  sellerSuccessFeeRate: number
  sellerSuccessFeeAmount: number
  sellerNetAmount: number
  deliveryMethod: DeliveryMethod
  deliveryFee?: number
  deliveryAddress?: string
  deliveryCity?: string
  deliveryNotes?: string
  deliveryProvider?: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  paymentStatus?: PaymentStatus
  inventoryRestored?: boolean
  createdAt: string
  updatedAt: string
}

export type PlaceOrderInput = {
  listingId: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  quantity: number
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  deliveryCity?: string
  deliveryNotes?: string
  paymentMethod: PaymentMethod
}
