import { isUuid, orderPublicRef } from "../../src/lib/platform/orderIdentity"
import { getMobileSupabaseClient } from "./supabase"

export type MobileOrder = {
  id: string
  orderNumber: string
  listingId: string
  listingName: string
  listingImage: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  discountAmount: number
  buyerTotal: number
  deliveryMethod: string
  paymentMethod: string | null
  paymentStatus: string
  status: string
  deliveryNotes: string | null
  createdAt: string
}

export type CreateOrderInput = {
  listingId: string
  quantity: number
  deliveryMethod: "pickup" | "seller_fleet"
  paymentMethod: "bank_transfer" | "discuss_with_seller"
  deliveryNotes?: string
  buyerPhone?: string
  deliveryAddress?: string
  deliveryCity?: string
}

function money(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN
  return Number.isFinite(n) ? Math.round(n) : 0
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function firstRow(data: unknown): Record<string, unknown> | null {
  return asRecord(data) ?? (Array.isArray(data) ? asRecord(data[0]) : null)
}

export function mapOrderRow(row: unknown): MobileOrder | null {
  const record = asRecord(row)
  if (!record) return null
  const id = typeof record.id === "string" ? record.id : ""
  const orderNumber = typeof record.order_number === "string" ? record.order_number : ""
  const listingId = typeof record.listing_id === "string" ? record.listing_id : ""
  if (!id || !orderNumber || !listingId) return null
  return {
    id,
    orderNumber,
    listingId,
    listingName: typeof record.listing_name === "string" && record.listing_name.trim() ? record.listing_name : "Motorcycle",
    listingImage: typeof record.listing_image === "string" ? record.listing_image : null,
    quantity: money(record.quantity) || 1,
    unitPrice: money(record.unit_price),
    subtotal: money(record.subtotal),
    discountAmount: money(record.discount_amount),
    buyerTotal: money(record.buyer_total),
    deliveryMethod: typeof record.delivery_method === "string" ? record.delivery_method : "pickup",
    paymentMethod: typeof record.payment_method === "string" ? record.payment_method : null,
    paymentStatus: typeof record.payment_status === "string" ? record.payment_status : "pending",
    status: typeof record.status === "string" ? record.status : "pending",
    deliveryNotes: typeof record.delivery_notes === "string" ? record.delivery_notes : null,
    createdAt: typeof record.created_at === "string" ? record.created_at : "",
  }
}

export function publicOrderRef(order: MobileOrder) {
  return orderPublicRef(order)
}

/** Matches Web createOrderRemote: existing create_order RPC. Database remains authoritative. */
export async function createOrderRemote(input: CreateOrderInput): Promise<MobileOrder> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.rpc("create_order", {
    p_listing_id: input.listingId,
    p_quantity: input.quantity,
    p_delivery_method: input.deliveryMethod,
    p_delivery_address: input.deliveryAddress ?? null,
    p_delivery_city: input.deliveryCity ?? null,
    p_payment_method: input.paymentMethod,
    p_buyer_phone: input.buyerPhone ?? null,
    p_delivery_notes: input.deliveryNotes?.trim() ? input.deliveryNotes.trim() : null,
  })
  if (error) throw error
  const order = mapOrderRow(firstRow(data))
  if (!order) throw new Error("Unable to place order.")
  return order
}

export async function fetchOrderByRef(ref: string): Promise<MobileOrder | null> {
  const client = getMobileSupabaseClient()
  const trimmed = ref.trim()
  if (!trimmed) return null
  const query = isUuid(trimmed)
    ? client.from("orders").select("*").eq("id", trimmed).maybeSingle()
    : client.from("orders").select("*").eq("order_number", trimmed).maybeSingle()
  const { data, error } = await query
  if (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : ""
    if (code === "PGRST116") return null
    throw error
  }
  return mapOrderRow(data)
}

export async function fetchMyOrders(): Promise<MobileOrder[]> {
  const client = getMobileSupabaseClient()
  const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (Array.isArray(data) ? data : []).flatMap((row) => {
    const order = mapOrderRow(row)
    return order ? [order] : []
  })
}

export function orderStatusLabel(order: Pick<MobileOrder, "status" | "paymentStatus">) {
  if (order.status === "cancelled") return "Dibatalkan"
  if (order.status === "completed") return "Selesai"
  if (order.status === "confirmed") return "Dikonfirmasi seller"
  if (order.paymentStatus === "pending" || order.status === "pending") return "Menunggu pembayaran"
  return order.status
}
