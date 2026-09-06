import type { ReactNode } from "react"
import { isSellerProfilesReady } from "../../lib/seller"
import { useSellerLive } from "../../lib/useSellerLive"

export function SellerDataGate({ children }: { children: ReactNode }) {
  useSellerLive()
  if (!isSellerProfilesReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
