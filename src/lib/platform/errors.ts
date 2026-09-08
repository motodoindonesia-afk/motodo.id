/**
 * Motodo RPC error contract (web + mobile).
 *
 * Postgres: RAISE EXCEPTION 'CODE: human message' USING DETAIL/HINT = CODE.
 * PostgREST: { message, details, hint, code: "P0001" }.
 * Clients must read the Motodo code from details, hint, or the CODE: prefix — never by English text.
 */

export const MOTODO_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "LISTING_NOT_FOUND",
  "LISTING_UNAVAILABLE",
  "INSUFFICIENT_STOCK",
  "INVALID_QUANTITY",
  "INVALID_DELIVERY_METHOD",
  "DELIVERY_NOT_AVAILABLE",
  "INVALID_PAYMENT_METHOD",
  "DELIVERY_ADDRESS_REQUIRED",
  "DELIVERY_CITY_REQUIRED",
  "SELF_PURCHASE",
  "DEMO_LISTING_NOT_FOR_SALE",
  "SELLER_NOT_APPROVED",
  "SELLER_NOT_FOUND",
  "SELLER_PROFILE_NOT_FOUND",
  "REJECTION_REASON_REQUIRED",
  "ORDER_NOT_FOUND",
  "INVALID_ORDER_STATE",
  "INVENTORY_INCONSISTENT",
  "QUANTITY_BELOW_RESERVED",
  "SELF_CONVERSATION",
  "CONVERSATION_NOT_FOUND",
  "CONVERSATION_START_FAILED",
  "MESSAGE_NOT_ALLOWED",
  "MESSAGE_EMPTY",
  "MESSAGE_TOO_LONG",
  "REVIEW_NOT_ALLOWED",
  "REVIEW_ALREADY_EXISTS",
  "INVALID_RATING",
  "INVALID_REVIEW_TITLE",
  "INVALID_REVIEW_BODY",
  "REVIEW_NOT_FOUND",
  "INVALID_REVIEW_STATUS",
  "NOTIFICATION_NOT_FOUND",
  "ACTIVE_REQUIRES_QUANTITY",
  "INVALID_LISTING_IMAGE_PATH",
  "CART_ITEM_NOT_FOUND",
  "FAVORITE_NOT_FOUND",
] as const

export type MotodoErrorCode = (typeof MOTODO_ERROR_CODES)[number]

const CODE_SET = new Set<string>(MOTODO_ERROR_CODES)

const CODE_PREFIX = /^([A-Z][A-Z0-9_]{2,}):\s*/

export class MotodoError extends Error {
  readonly motodoCode: MotodoErrorCode | null

  constructor(message: string, motodoCode: MotodoErrorCode | null = null) {
    super(message)
    this.name = "MotodoError"
    this.motodoCode = motodoCode
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseCodeToken(value: unknown): MotodoErrorCode | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (CODE_SET.has(trimmed)) return trimmed as MotodoErrorCode
  const prefixed = CODE_PREFIX.exec(trimmed)
  if (prefixed && CODE_SET.has(prefixed[1])) return prefixed[1] as MotodoErrorCode
  return null
}

/** Stable Motodo code from a PostgREST / Postgres / MotodoError value. */
export function motodoErrorCode(error: unknown): MotodoErrorCode | null {
  if (error instanceof MotodoError) return error.motodoCode
  const record = asRecord(error)
  if (record) {
    const fromFields =
      parseCodeToken(record.details) || parseCodeToken(record.hint) || parseCodeToken(record.message)
    if (fromFields) return fromFields
    if (typeof record.message === "string") {
      const nested = parseCodeToken(record.message)
      if (nested) return nested
    }
  }
  if (error instanceof Error) return parseCodeToken(error.message)
  if (typeof error === "string") return parseCodeToken(error)
  return null
}

export function stripMotodoCodePrefix(message: string) {
  const match = CODE_PREFIX.exec(message.trim())
  if (!match) return message.trim()
  return message.trim().slice(match[0].length).trim()
}
