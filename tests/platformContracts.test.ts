import { describe, expect, it } from "vitest"
import { motodoErrorCode, stripMotodoCodePrefix } from "../src/lib/platform/errors"
import { mapCartItemRow } from "../src/lib/cartSupabase"
import { mapFavoriteRow } from "../src/lib/favoritesSupabase"
import { cartQuantityIsAllowed, isCartLinePurchasable, isListingEligibleForCart, isListingEligibleForFavorite } from "../src/lib/platform/commerce"
import { isListingEligibleForSale } from "../src/lib/platform/demoInventory"
import { getNotificationResource } from "../src/lib/platform/notifications"
import { isUuid, orderMatchesRef, orderPublicRef } from "../src/lib/platform/orderIdentity"
import { isAdminCancellableOrderStatus } from "../src/lib/platform/orderAdmin"

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

describe("admin order cancellation statuses", () => {
  it("allows pending and confirmed only", () => {
    expect(isAdminCancellableOrderStatus("pending")).toBe(true)
    expect(isAdminCancellableOrderStatus("confirmed")).toBe(true)
    expect(isAdminCancellableOrderStatus("completed")).toBe(false)
    expect(isAdminCancellableOrderStatus("cancelled")).toBe(false)
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

describe("favorites eligibility", () => {
  it("allows demo and sold listings on a wishlist", () => {
    expect(isListingEligibleForFavorite({ status: "active" })).toBe(true)
    expect(isListingEligibleForFavorite({ status: "sold" })).toBe(true)
    expect(isListingEligibleForFavorite({ status: "draft" })).toBe(false)
    expect(isListingEligibleForFavorite({ status: "draft", sellerId: "s1" }, "s1")).toBe(true)
  })
})

describe("cart eligibility", () => {
  it("rejects demo, inactive, and own listings", () => {
    expect(isListingEligibleForCart({ isDemo: true, status: "active" })).toBe(false)
    expect(isListingEligibleForCart({ isDemo: false, status: "active" })).toBe(true)
    expect(isListingEligibleForCart({ isDemo: false, status: "sold" })).toBe(false)
    expect(isListingEligibleForCart({ isDemo: false, status: "active", sellerId: "s1" }, "s1")).toBe(false)
  })

  it("rejects invalid cart quantities against availability", () => {
    expect(cartQuantityIsAllowed(1, 1, 1)).toBe(true)
    expect(cartQuantityIsAllowed(2, 1, 2)).toBe(false)
    expect(cartQuantityIsAllowed(0, 1, 1)).toBe(false)
    expect(cartQuantityIsAllowed(1.5, 2, 2)).toBe(false)
  })

  it("treats demo, inactive, and unavailable cart lines as not purchasable", () => {
    expect(isCartLinePurchasable({ isAvailable: true, listingIsDemo: false, listingStatus: "active" })).toBe(true)
    expect(isCartLinePurchasable({ isAvailable: true, listingIsDemo: true, listingStatus: "active" })).toBe(false)
    expect(isCartLinePurchasable({ isAvailable: false, listingStatus: "sold" })).toBe(false)
    expect(isCartLinePurchasable({ listingStatus: "active" })).toBe(false)
  })
})

describe("cart and favorite error codes", () => {
  it("recognizes CART_ITEM_NOT_FOUND and DEMO_LISTING_NOT_FOR_SALE", () => {
    expect(motodoErrorCode({ details: "CART_ITEM_NOT_FOUND", message: "CART_ITEM_NOT_FOUND: missing" })).toBe(
      "CART_ITEM_NOT_FOUND",
    )
    expect(motodoErrorCode({ hint: "DEMO_LISTING_NOT_FOR_SALE" })).toBe("DEMO_LISTING_NOT_FOR_SALE")
    expect(motodoErrorCode({ details: "FAVORITE_NOT_FOUND" })).toBe("FAVORITE_NOT_FOUND")
  })
})

describe("favorite and cart mappers", () => {
  it("maps favorite rows to Favorite without embedding Listing", () => {
    expect(
      mapFavoriteRow({
        id: "f1",
        user_id: "u1",
        listing_id: "l1",
        created_at: "2026-09-07T00:00:00.000Z",
      }),
    ).toEqual({
      id: "f1",
      userId: "u1",
      listingId: "l1",
      createdAt: "2026-09-07T00:00:00.000Z",
    })
  })

  it("maps cart rows including stale availability flags", () => {
    expect(
      mapCartItemRow({
        id: "c1",
        user_id: "u1",
        listing_id: "l1",
        quantity: 1,
        created_at: "2026-09-07T00:00:00.000Z",
        updated_at: "2026-09-07T01:00:00.000Z",
        listing_status: "sold",
        listing_is_demo: false,
        available_quantity: 0,
        is_available: false,
      }),
    ).toMatchObject({
      id: "c1",
      userId: "u1",
      listingId: "l1",
      quantity: 1,
      isAvailable: false,
      availableQuantity: 0,
      listingStatus: "sold",
    })
  })
})
