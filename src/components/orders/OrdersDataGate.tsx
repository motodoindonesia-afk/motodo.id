import type { ReactNode } from "react"
import { isOrdersReady } from "../../lib/orders"
import { useOrdersLive } from "../../lib/useOrdersLive"

export function OrdersDataGate({ children }: { children: ReactNode }) {
  useOrdersLive()
  if (!isOrdersReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
