import { describe, expect, it } from "vitest"
import { motodoErrorCode, stripMotodoCodePrefix } from "../src/lib/platform/errors"
import { isListingEligibleForSale } from "../src/lib/platform/demoInventory"
import { getNotificationResource } from "../src/lib/platform/notifications"
import { isUuid, orderMatchesRef, orderPublicRef } from "../src/lib/platform/orderIdentity"

describe("RPC error contract", () => {
  it("reads Motodo codes from PostgREST details, hint, and CODE prefix", () => {
    expect(motodoErrorCode({ details: "INSUFFICIENT_STOCK", message: "x" })).toBe("INSUFFICIENT_STOCK")
    expect(motodoErrorCode({ hint: "FORBIDDEN", message: "nope" })).toBe("FORBIDDEN")
    expect(motodoErrorCode({ message: "DEMO_LISTING_NOT_FOR_SALE: This listing is demo data and cannot be purchased." })).toBe(
      "DEMO_LISTING_NOT_FOR_SALE",
    )
    expect(stripMotodoCodePrefix("INSUFFICIENT_STOCK: Not enough units available.")).toBe("Not enough units available.")
  })

  it("does not treat English copy as a code", () => {
    expect(motodoErrorCode({ message: "Not enough units available." })).toBeNull()
  })
})

describe("order identity", () => {
  const order = {
    id: "11111111-1111-4111-8111-111111111111",
    orderNumber: "MTD-ABCDEF12",
  }

  it("keeps UUID as id and MTD as the public/web ref", () => {
    expect(isUuid(order.id)).toBe(true)
    expect(orderPublicRef(order)).toBe("MTD-ABCDEF12")
    expect(orderMatchesRef(order, order.id)).toBe(true)
    expect(orderMatchesRef(order, order.orderNumber)).toBe(true)
  })
})

describe("notification resource", () => {
  it("uses entity_type + entity_id and ignores web link", () => {
    expect(
      getNotificationResource({
        relatedType: "order",
        relatedId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        link: "/orders/MTD-OLD",
      }),
    ).toEqual({
      entityType: "order",
      entityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    })
  })
})

describe("demo inventory", () => {
  it("blocks checkout of demo listings while allowing real active listings", () => {
    expect(isListingEligibleForSale({ isDemo: true, status: "active" })).toBe(false)
    expect(isListingEligibleForSale({ isDemo: false, status: "active" })).toBe(true)
    expect(isListingEligibleForSale({ isDemo: false, status: "draft" })).toBe(false)
  })
})
