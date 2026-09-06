import type { ReactNode } from "react"
import { isReviewsReady } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"

export function ReviewsDataGate({ children }: { children: ReactNode }) {
  useReviewsLive()
  if (!isReviewsReady()) {
    return (
      <main className="bg-white py-16">
        <p className="text-center text-sm text-navy-muted">Loading...</p>
      </main>
    )
  }
  return children
}
