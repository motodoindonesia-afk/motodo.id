import type { ReactNode } from "react"
import { isListingsReady } from "../../lib/listings"
import { useListingsLive } from "../../lib/useListingsLive"

export function ListingsDataGate({ children }: { children: ReactNode }) {
  useListingsLive()
  if (!isListingsReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
