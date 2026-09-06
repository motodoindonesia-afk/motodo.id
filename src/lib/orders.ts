import type { MotorcycleListing as CatalogListing } from "../types/marketplace"
import type {
  DeliveryMethod,
  DiscountType,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlaceOrderInput,
} from "../types/order"
import { getUserById } from "./auth"
import { coerceListingQuantity, formatIDR, unitsLeftMessage } from "./listingForm"
import { applyListingInventoryChange, getListingById, getPublicListingById, syncListingAvailability } from "./listings"
import { createNotification } from "./notifications"
import { getAvailableStock, listingStockSummary } from "./inventory"
import { getSellerProfile, isSellerFleetAvailable } from "./seller"
import { userFacingMessage } from "./userFacingError"
import { isSupabaseConfigured } from "./supabase"
import {
  createOrderRemote,
  isOrdersHydrated,
  peekCachedOrder,
  peekCachedOrders,
  updateSellerOrderStatusRemote,
} from "./ordersSupabase"

export const ORDERS_STORAGE_KEY = "motodo_orders"
export const ORDERS_UPDATED_EVENT = "motodo:orders-updated"
export { SELLER_SUCCESS_FEE_RATE } from "../types/order"
import { SELLER_SUCCESS_FEE_RATE } from "../types/order"

export class OrderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OrderError"
  }
}

function notifyOrdersUpdated() {
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT))
}

function money(value: number) {
  return Math.round(value)
}

export function calculateSubtotal(unitPrice: number, quantity: number) {
  return money(unitPrice * quantity)
}

export function calculateDiscount(
  subtotal: number,
  discountType?: DiscountType,
  discountValue?: number,
  enabled = false,
) {
  if (!enabled || !discountType || typeof discountValue !== "number" || discountValue <= 0) return 0
  if (discountType === "percentage") return money((subtotal * discountValue) / 100)
  return money(Math.min(discountValue, subtotal))
}

export function calculateBuyerTotal(subtotal: number, discountAmount: number) {
  return money(Math.max(0, subtotal - discountAmount))
}

export function calculateSellerSuccessFee(buyerTotal: number, rate = SELLER_SUCCESS_FEE_RATE) {
  return money(buyerTotal * rate)
}

export function calculateSellerNetAmount(buyerTotal: number, sellerSuccessFeeAmount: number) {
  return money(buyerTotal - sellerSuccessFeeAmount)
}

function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return value === "pickup" || value === "seller_fleet" || value === "third_party"
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "bank_transfer" || value === "discuss_with_seller"
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return value === "pending" || value === "confirmed" || value === "completed" || value === "cancelled"
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === "pending" || value === "paid" || value === "failed" || value === "refunded"
}

function isDiscountType(value: unknown): value is DiscountType {
  return value === "percentage" || value === "fixed"
}

function generateOrderId() {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
  return `MTD-${raw}`
}

export function normalizeOrder(value: Partial<Order>): Order | null {
  if (!value.id || !value.listingId || !value.sellerId || !value.buyerId) return null
  if (typeof value.listingName !== "string") return null
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null

  const unitPrice = typeof value.unitPrice === "number" ? money(value.unitPrice) : 0
  const quantity = coerceListingQuantity(value.quantity) || 1
  const safeQuantity = quantity < 1 ? 1 : quantity
  const subtotal = typeof value.subtotal === "number" ? money(value.subtotal) : calculateSubtotal(unitPrice, safeQuantity)
  const discountAmount = typeof value.discountAmount === "number" ? money(value.discountAmount) : 0
  const buyerTotal =
    typeof value.buyerTotal === "number" ? money(value.buyerTotal) : calculateBuyerTotal(subtotal, discountAmount)
  const sellerSuccessFeeRate =
    typeof value.sellerSuccessFeeRate === "number" ? value.sellerSuccessFeeRate : SELLER_SUCCESS_FEE_RATE
  const sellerSuccessFeeAmount =
    typeof value.sellerSuccessFeeAmount === "number"
      ? money(value.sellerSuccessFeeAmount)
      : calculateSellerSuccessFee(buyerTotal, sellerSuccessFeeRate)
  const sellerNetAmount =
    typeof value.sellerNetAmount === "number"
      ? money(value.sellerNetAmount)
      : calculateSellerNetAmount(buyerTotal, sellerSuccessFeeAmount)

  return {
    id: value.id,
    listingId: value.listingId,
    sellerId: value.sellerId,
    buyerId: value.buyerId,
    listingName: value.listingName,
    listingImage: typeof value.listingImage === "string" ? value.listingImage : undefined,
    buyerName: typeof value.buyerName === "string" ? value.buyerName : "",
    buyerEmail: typeof value.buyerEmail === "string" ? value.buyerEmail : "",
    buyerPhone: typeof value.buyerPhone === "string" ? value.buyerPhone : "",
    unitPrice,
    quantity: safeQuantity,
    subtotal,
    discountType: isDiscountType(value.discountType) ? value.discountType : undefined,
    discountValue: typeof value.discountValue === "number" ? value.discountValue : undefined,
    discountAmount,
    buyerTotal,
    sellerSuccessFeeRate,
    sellerSuccessFeeAmount,
    sellerNetAmount,
    deliveryMethod: isDeliveryMethod(value.deliveryMethod) ? value.deliveryMethod : "pickup",
    deliveryFee: typeof value.deliveryFee === "number" ? money(value.deliveryFee) : 0,
    deliveryAddress: typeof value.deliveryAddress === "string" ? value.deliveryAddress : undefined,
    deliveryCity: typeof value.deliveryCity === "string" ? value.deliveryCity : undefined,
    deliveryNotes: typeof value.deliveryNotes === "string" ? value.deliveryNotes : undefined,
    deliveryProvider: typeof value.deliveryProvider === "string" ? value.deliveryProvider : undefined,
    paymentMethod: isPaymentMethod(value.paymentMethod) ? value.paymentMethod : "bank_transfer",
    status: isOrderStatus(value.status) ? value.status : "pending",
    paymentStatus: isPaymentStatus(value.paymentStatus) ? value.paymentStatus : "pending",
    inventoryRestored: Boolean(value.inventoryRestored),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Order>[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const order = normalizeOrder(item)
      return order ? [order] : []
    })
  } catch {
    return []
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  notifyOrdersUpdated()
}

export function isOrdersReady() {
  return isOrdersHydrated()
}

export function getOrders(): Order[] {
  if (isSupabaseConfigured()) return peekCachedOrders()
  return [...readOrders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getOrderById(id: string): Order | null {
  if (isSupabaseConfigured()) return peekCachedOrder(id) ?? null
  return readOrders().find((item) => item.id === id) ?? null
}

export function getBuyerOrders(buyerId: string): Order[] {
  return getOrders().filter((item) => item.buyerId === buyerId)
}

export function getSellerOrders(sellerId: string): Order[] {
  return getOrders().filter((item) => item.sellerId === sellerId)
}

export function getSellerOrderCounts(sellerId: string) {
  const orders = getSellerOrders(sellerId)
  return {
    total: orders.length,
    pending: orders.filter((item) => item.status === "pending").length,
    confirmed: orders.filter((item) => item.status === "confirmed").length,
    completed: orders.filter((item) => item.status === "completed").length,
    cancelled: orders.filter((item) => item.status === "cancelled").length,
  }
}

function isCurrentMonth(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function getSellerRevenueSummary(sellerId: string, period: "all" | "month" = "all") {
  const orders = getSellerOrders(sellerId).filter((order) => (period === "month" ? isCurrentMonth(order.createdAt) : true))
  const counted = orders.filter((order) => order.status === "confirmed" || order.status === "completed")
  const pending = orders.filter((order) => order.status === "pending")
  const gross = counted.reduce((total, order) => total + order.buyerTotal, 0)
  const fee = counted.reduce((total, order) => total + order.sellerSuccessFeeAmount, 0)
  const net = counted.reduce((total, order) => total + order.sellerNetAmount, 0)
  return {
    gross,
    fee,
    net,
    countedCount: counted.length,
    pendingCount: pending.length,
    pendingValue: pending.reduce((total, order) => total + order.buyerTotal, 0),
  }
}

export function canBuyerViewOrder(order: Order | null, buyerId: string) {
  return Boolean(order && order.buyerId === buyerId)
}

export function canSellerViewOrder(order: Order | null, sellerId: string) {
  return Boolean(order && order.sellerId === sellerId)
}

export function listingAvailableQuantity(listing: CatalogListing) {
  if (listing.status === "draft") return 0
  const stored = getListingById(listing.id)
  return getAvailableStock({
    id: listing.id,
    quantity: stored?.quantity ?? listing.quantity,
    status: stored?.status ?? listing.status,
  })
}

export function isListingPurchasable(listing: CatalogListing | undefined) {
  if (!listing) return false
  if (listing.status === "draft" || listing.status === "sold") return false
  return listingAvailableQuantity(listing) > 0
}

function validateQuantity(quantity: number, available: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new OrderError("Enter a whole number of 1 or more.")
  }
  if (quantity > available) {
    throw new OrderError(unitsLeftMessage(available))
  }
}

export function validateCheckoutQuantity(raw: string, available: number): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return "Quantity is required."
  if (!/^\d+$/.test(trimmed)) return "Quantity must be a whole number."
  const quantity = Number(trimmed)
  if (quantity < 1) return "Quantity must be greater than 0."
  if (quantity > available) return unitsLeftMessage(available)
  return null
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  if (isSupabaseConfigured()) {
    try {
      return await createOrderRemote(input)
    } catch (error) {
      throw new OrderError(userFacingMessage(error, "Unable to place order."))
    }
  }

  const buyer = getUserById(input.buyerId)
  if (!buyer) throw new OrderError("You must be logged in to place an order.")

  const listing = getPublicListingById(input.listingId)
  if (!listing) throw new OrderError("Motorcycle listing not found.")
  if (!isListingPurchasable(listing)) throw new OrderError("This motorcycle is no longer available.")

  const available = listingAvailableQuantity(listing)
  if (available <= 0) throw new OrderError("This motorcycle is no longer available.")
  if (listing.sellerId === input.buyerId) throw new OrderError("You cannot purchase your own listing.")

  validateQuantity(input.quantity, available)

  if (input.deliveryMethod === "third_party") {
    throw new OrderError("Third-party logistics is not available yet.")
  }
  if (input.deliveryMethod !== "pickup" && input.deliveryMethod !== "seller_fleet") {
    throw new OrderError("Select a delivery method.")
  }
  if (input.deliveryMethod === "seller_fleet") {
    if (!isSellerFleetAvailable(listing.sellerId)) {
      throw new OrderError("Seller Fleet is not available for this listing.")
    }
    if (!input.deliveryAddress?.trim()) throw new OrderError("Delivery address is required.")
    if (!input.deliveryCity?.trim()) throw new OrderError("City is required.")
  }

  const unitPrice = money(listing.priceValue)
  const quantity = input.quantity
  const subtotal = calculateSubtotal(unitPrice, quantity)
  const discountAmount = calculateDiscount(subtotal)
  const buyerTotal = calculateBuyerTotal(subtotal, discountAmount)
  const sellerSuccessFeeAmount = calculateSellerSuccessFee(buyerTotal)
  const sellerNetAmount = calculateSellerNetAmount(buyerTotal, sellerSuccessFeeAmount)
  const now = new Date().toISOString()

  const live = getPublicListingById(input.listingId)
  if (!live || !isListingPurchasable(live)) throw new OrderError("This motorcycle is no longer available.")
  const liveAvailable = listingAvailableQuantity(live)
  validateQuantity(quantity, liveAvailable)

  const order: Order = {
    id: generateOrderId(),
    listingId: listing.id,
    sellerId: listing.sellerId,
    buyerId: input.buyerId,
    listingName: listing.name,
    listingImage: listing.image || undefined,
    buyerName: input.buyerName.trim() || buyer.fullName,
    buyerEmail: input.buyerEmail.trim() || buyer.email,
    buyerPhone: input.buyerPhone.trim(),
    unitPrice,
    quantity,
    subtotal,
    discountAmount,
    buyerTotal,
    sellerSuccessFeeRate: SELLER_SUCCESS_FEE_RATE,
    sellerSuccessFeeAmount,
    sellerNetAmount,
    deliveryMethod: input.deliveryMethod,
    deliveryFee: 0,
    deliveryAddress: input.deliveryMethod === "seller_fleet" ? input.deliveryAddress?.trim() : undefined,
    deliveryCity: input.deliveryMethod === "seller_fleet" ? input.deliveryCity?.trim() : undefined,
    deliveryNotes: input.deliveryNotes?.trim() || undefined,
    paymentMethod: input.paymentMethod,
    status: "pending",
    paymentStatus: "pending",
    inventoryRestored: true,
    createdAt: now,
    updatedAt: now,
  }

  writeOrders([order, ...readOrders()])
  const stored = getListingById(order.listingId)
  const stock = stored ? listingStockSummary(stored) : null
  if (!stock || stock.reserved > stock.total) {
    writeOrders(readOrders().filter((item) => item.id !== order.id))
    throw new OrderError(unitsLeftMessage(liveAvailable))
  }
  syncListingAvailability(order.listingId)
  createNotification({
    userId: order.sellerId,
    type: "new_order",
    title: "New Order",
    message: `You received a new order for ${order.listingName}.`,
    relatedId: order.id,
    relatedType: "order",
    unique: true,
  })
  return order
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed"],
  completed: [],
  cancelled: [],
}

export async function updateSellerOrderStatus(orderId: string, sellerId: string, nextStatus: OrderStatus): Promise<Order> {
  if (isSupabaseConfigured()) {
    try {
      return await updateSellerOrderStatusRemote(orderId, nextStatus)
    } catch (error) {
      throw new OrderError(userFacingMessage(error, "Unable to update order."))
    }
  }

  const order = getOrderById(orderId)
  if (!order || order.sellerId !== sellerId) throw new OrderError("You don't have permission to update this order.")
  if (!ALLOWED_TRANSITIONS[order.status].includes(nextStatus)) {
    throw new OrderError("This order status cannot be changed.")
  }

  let next: Order = {
    ...order,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }

  if (nextStatus === "cancelled" && !order.inventoryRestored) {
    applyListingInventoryChange(order.listingId, order.quantity)
    next = { ...next, inventoryRestored: true }
  }

  writeOrders(readOrders().map((item) => (item.id === orderId ? next : item)))

  if (nextStatus === "completed" && order.inventoryRestored) {
    const consumed = applyListingInventoryChange(order.listingId, -order.quantity)
    if (!consumed) {
      writeOrders(readOrders().map((item) => (item.id === orderId ? order : item)))
      throw new OrderError("Unable to complete this order because inventory is inconsistent.")
    }
  }

  syncListingAvailability(order.listingId)
  notifyBuyerOrderStatus(next)
  return next
}

function notifyBuyerOrderStatus(order: Order) {
  if (order.status === "confirmed") {
    createNotification({
      userId: order.buyerId,
      type: "order_confirmed",
      title: "Order Confirmed",
      message: `Your order for ${order.listingName} has been confirmed by the seller.`,
      relatedId: order.id,
      relatedType: "order",
      unique: true,
    })
    return
  }
  if (order.status === "completed") {
    createNotification({
      userId: order.buyerId,
      type: "order_completed",
      title: "Order Completed",
      message: `Your order for ${order.listingName} has been completed.`,
      relatedId: order.id,
      relatedType: "order",
      unique: true,
    })
    createNotification({
      userId: order.buyerId,
      type: "review_reminder",
      title: "Rate Your Purchase",
      message: `How was your experience with your ${order.listingName}?`,
      relatedId: order.id,
      relatedType: "order",
      unique: true,
    })
    return
  }
  if (order.status === "cancelled") {
    createNotification({
      userId: order.buyerId,
      type: "order_cancelled",
      title: "Order Cancelled",
      message: `Your order for ${order.listingName} has been cancelled.`,
      relatedId: order.id,
      relatedType: "order",
      unique: true,
    })
  }
}

export function deliveryMethodLabel(method: DeliveryMethod) {
  if (method === "pickup") return "Pickup at Showroom"
  if (method === "seller_fleet") return "Seller Fleet"
  return "Third-Party Logistics"
}

export function deliveryFeeLabel(order: Pick<Order, "deliveryMethod" | "deliveryFee">) {
  if (order.deliveryMethod === "pickup") return "Not applicable"
  if (order.deliveryMethod === "seller_fleet") return "To be confirmed with seller"
  if (typeof order.deliveryFee === "number" && order.deliveryFee > 0) return formatIDR(order.deliveryFee)
  return "To be confirmed"
}

export function paymentStatusLabel(status?: PaymentStatus) {
  if (status === "paid") return "Paid"
  if (status === "failed") return "Failed"
  if (status === "refunded") return "Refunded"
  return "Pending"
}

export function paymentMethodLabel(method: PaymentMethod) {
  if (method === "bank_transfer") return "Bank Transfer"
  return "Other / Discuss with Seller"
}

export function orderStatusLabel(status: OrderStatus) {
  if (status === "pending") return "Pending"
  if (status === "confirmed") return "Confirmed"
  if (status === "completed") return "Completed"
  return "Cancelled"
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function catalogFromOrder(order: Order): CatalogListing {
  const live = getPublicListingById(order.listingId)
  if (live) return live
  const stored = getListingById(order.listingId)
  return {
    id: order.listingId,
    sellerId: order.sellerId,
    name: order.listingName,
    price: formatIDR(order.unitPrice),
    priceValue: order.unitPrice,
    year: stored?.year ?? 0,
    location: stored?.city ?? "",
    category: stored?.category ?? "Others",
    image: order.listingImage ?? "",
    images: order.listingImage ? [order.listingImage] : [],
    mileage: "—",
    engine: "—",
    transmission: "—",
    fuel: "—",
    color: "—",
    description: "",
    seller: {
      name: getSellerProfile(order.sellerId)?.businessName ?? "Seller",
      location: getSellerProfile(order.sellerId)?.city ?? "",
      memberSince: "2026",
      verified: getSellerProfile(order.sellerId)?.status === "approved",
    },
    listedAt: order.createdAt,
    status: stored?.status,
    quantity: stored?.quantity,
    brand: stored?.brand,
    model: stored?.model,
  }
}

export function subscribeOrderUpdates(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === ORDERS_STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener(ORDERS_UPDATED_EVENT, onChange)
  window.addEventListener("storage", handleStorage)
  return () => {
    window.removeEventListener(ORDERS_UPDATED_EVENT, onChange)
    window.removeEventListener("storage", handleStorage)
  }
}
