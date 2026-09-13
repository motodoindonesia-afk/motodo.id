import { describe, expect, it } from "vitest"
import { sellerStoreCoverStoragePath, storeCoverValidationError } from "../src/lib/platform/storeCover"

describe("store cover contract", () => {
  it("uses a stable seller-owned storage path", () => {
    const sellerId = "a0000000-0000-4000-8000-000000000001"
    expect(sellerStoreCoverStoragePath(sellerId)).toBe(`${sellerId}/cover.webp`)
  })

  it("rejects unsupported types and oversized files before upload", () => {
    expect(storeCoverValidationError({ type: "image/gif", size: 100 })).toBe("unsupported")
    expect(storeCoverValidationError({ type: "application/pdf", size: 100 })).toBe("unsupported")
    expect(storeCoverValidationError({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 })).toBe("too_large")
    expect(storeCoverValidationError({ type: "image/png", size: 2048 })).toBeNull()
    expect(storeCoverValidationError({ type: "image/webp", size: 2048 })).toBeNull()
    expect(storeCoverValidationError({ type: "image/jpg", size: 2048 })).toBeNull()
  })
})
