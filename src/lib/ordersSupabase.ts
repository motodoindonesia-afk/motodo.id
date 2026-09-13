import type { DeliveryMethod, Order, OrderStatus, PaymentMethod, PaymentStatus, PlaceOrderInput } from "../types/order"
import { SELLER_SUCCESS_FEE_RATE } from "../types/order"
import { getListingByIdRemote, putCachedListing, refreshListingStock } from "./listingsSupabase"
import { throwUserFacing } from "./userFacingError"
import { getSupabaseClient, isSupabaseConfigured } from "./supabase"

const ORDERS_UPDATED_EVENT = "motodo:orders-updated"

type OrderRow = {
  id: string
  order_number: string
  buyer_id: string
  seller_id: string
  listing_id: string
  quantity: number
  unit_price: number | string
  subtotal: number | string
  discount_amount: number | string
  buyer_total: number | string
  seller_fee_rate: number | string
  seller_fee_amount: number | string
  seller_net_amount: number | string
  delivery_method: string
  delivery_address: string | null
  delivery_city: string | null
  delivery_notes: string | null
  payment_method: string | null
  payment_status: string
  status: string
  listing_name: string | null
  listing_image: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  created_at: string
  updated_at: string
}

const orderCache = new Map<string, Order>()
const orderIdIndex = new Map<string, string>()
let hydrated = false

function notifyOrdersUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT))
  }
}

export function isOrdersHydrated() {
  if (!isSupabaseConfigured()) return true
  return hydrated
}

export function setOrdersHydrated(value: boolean) {
  hydrated = value
  notifyOrdersUpdated()
}

export function clearOrderCache() {
  orderCache.clear()
  orderIdIndex.clear()
  hydrated = false
  notifyOrdersUpdated()
}

export function peekCachedOrders(): Order[] {
  return [...orderCache.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function peekCachedOrder(ref: string): Order | undefined {
  return orderCache.get(ref) ?? (orderIdIndex.get(ref) ? orderCache.get(orderIdIndex.get(ref) as string) : undefined)
}

function money(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : value
  return Number.isFinite(n) ? Math.round(n as number) : 0
}

function isDeliveryMethod(value: string): value is DeliveryMethod {
  return value === "pickup" || value === "seller_fleet" || value === "third_party"
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "bank_transfer" || value === "discuss_with_seller"
}

function isOrderStatus(value: string): value is OrderStatus {
  return value === "pending" || value === "confirmed" || value === "completed" || value === "cancelled"
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return value === "pending" || value === "paid" || value === "failed" || value === "refunded"
}

export function mapOrderRow(row: OrderRow): Order | null {
  if (!row.id || !row.order_number || !row.listing_id || !row.seller_id || !row.buyer_id) return null
  const feeRate = typeof row.seller_fee_rate === "string" ? Number(row.seller_fee_rate) : row.seller_fee_rate
  return {
    id: row.id,
    orderNumber: row.order_number,
    listingId: row.listing_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    listingName: row.listing_name ?? "Motorcycle",
    listingImage: row.listing_image ?? undefined,
    buyerName: row.buyer_name ?? "",
    buyerEmail: row.buyer_email ?? "",
    buyerPhone: row.buyer_phone ?? "",
    unitPrice: money(row.unit_price),
    quantity: row.quantity,
    subtotal: money(row.subtotal),
    discountAmount: money(row.discount_amount),
    buyerTotal: money(row.buyer_total),
    sellerSuccessFeeRate: Number.isFinite(feeRate) ? feeRate : SELLER_SUCCESS_FEE_RATE,
    sellerSuccessFeeAmount: money(row.seller_fee_amount),
    sellerNetAmount: money(row.seller_net_amount),
    deliveryMethod: isDeliveryMethod(row.delivery_method) ? row.delivery_method : "pickup",
    deliveryFee: 0,
    deliveryAddress: row.delivery_address ?? undefined,
    deliveryCity: row.delivery_city ?? undefined,
    deliveryNotes: row.delivery_notes ?? undefined,
    paymentMethod: row.payment_method && isPaymentMethod(row.payment_method) ? row.payment_method : "bank_transfer",
    status: isOrderStatus(row.status) ? row.status : "pending",
    paymentStatus: isPaymentStatus(row.payment_status) ? row.payment_status : "pending",
    inventoryRestored: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rememberOrder(order: Order) {
  orderCache.set(order.id, order)
  orderIdIndex.set(order.id, order.id)
  orderIdIndex.set(order.orderNumber, order.id)
  notifyOrdersUpdated()
}

function asOrderRow(data: unknown): OrderRow | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as OrderRow
}

function asOrderRows(data: unknown): OrderRow[] {
  return Array.isArray(data) ? (data as OrderRow[]) : []
}

function firstOrderRow(data: unknown): OrderRow | null {
  return asOrderRow(data) ?? asOrderRows(data)[0] ?? null
}

async function afterOrderMutation(row: OrderRow) {
  const order = mapOrderRow(row)
  if (!order) throw new Error("Unable to read order.")
  rememberOrder(order)
  await refreshListingStock([row.listing_id])
  if (order.status === "completed") {
    const listing = await getListingByIdRemote(row.listing_id)
    if (listing) putCachedListing(listing)
  }
  return order
}

export async function hydrateOrders() {
  const client = getSupabaseClient()
  const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false })
  if (error) throwUserFacing(error, "Unable to load orders.")
  orderCache.clear()
  orderIdIndex.clear()
  const rows = asOrderRows(data)
  for (const row of rows) {
    const order = mapOrderRow(row)
    if (!order) continue
    rememberOrder(order)
  }
  const listingIds = [...new Set(rows.map((row) => row.listing_id))]
  if (listingIds.length > 0) await refreshListingStock(listingIds)
  hydrated = true
  notifyOrdersUpdated()
}

export async function createOrderRemote(input: PlaceOrderInput): Promise<Order> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("create_order", {
    p_listing_id: input.listingId,
    p_quantity: input.quantity,
    p_delivery_method: input.deliveryMethod,
    p_delivery_address: input.deliveryAddress ?? null,
    p_delivery_city: input.deliveryCity ?? null,
    p_payment_method: input.paymentMethod ?? null,
    p_buyer_phone: input.buyerPhone ?? null,
    p_delivery_notes: input.deliveryNotes ?? null,
  })
  if (error) throwUserFacing(error, "Unable to place order.")
  const row = firstOrderRow(data)
  if (!row) throw new Error("Unable to place order.")
  return afterOrderMutation(row)
}

async function callOrderRpc(name: "confirm_order" | "complete_order" | "cancel_order", orderRef: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc(name, { p_order_ref: orderRef })
  if (error) throwUserFacing(error, "Unable to update order.")
  const row = firstOrderRow(data)
  if (!row) throw new Error("Unable to update order.")
  return afterOrderMutation(row)
}

export async function confirmOrderRemote(orderRef: string) {
  return callOrderRpc("confirm_order", orderRef)
}

export async function completeOrderRemote(orderRef: string) {
  return callOrderRpc("complete_order", orderRef)
}

export async function cancelOrderRemote(orderRef: string) {
  return callOrderRpc("cancel_order", orderRef)
}

export async function adminCancelOrderRemote(orderRef: string) {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc("admin_cancel_order", { p_order_ref: orderRef })
  if (error) throwUserFacing(error, "Unable to cancel order.")
  const row = firstOrderRow(data)
  if (!row) throw new Error("Unable to cancel order.")
  return afterOrderMutation(row)
}

export async function updateSellerOrderStatusRemote(orderRef: string, nextStatus: OrderStatus): Promise<Order> {
  if (nextStatus === "confirmed") return confirmOrderRemote(orderRef)
  if (nextStatus === "completed") return completeOrderRemote(orderRef)
  if (nextStatus === "cancelled") return cancelOrderRemote(orderRef)
  throw new Error("This order status cannot be changed.")
}
