import { useState } from "react"
import { RatingSummary } from "./RatingSummary"
import { ReviewCard } from "./ReviewCard"
import { Button } from "../ui/Button"
import { getListingReviews, getListingRatingSummary, getRatingBreakdown } from "../../lib/reviews"
import { useReviewsLive } from "../../lib/useReviewsLive"
import { useT } from "../../i18n"

export function ListingReviewsSection({ listingId }: { listingId: string }) {
  useReviewsLive()
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const reviews = getListingReviews(listingId)
  const summary = getListingRatingSummary(listingId)
  const visible = expanded ? reviews : reviews.slice(0, 5)
  const average = summary.average
  const breakdown = getRatingBreakdown(reviews)

  return (
    <section className="mt-12 sm:mt-14">
      <RatingSummary title={t("review.reviews")} average={average} count={summary.count} breakdown={reviews.length > 0 ? breakdown : undefined} />
      {reviews.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4">
            {visible.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {reviews.length > 5 ? (
            <Button variant="secondary" className="mt-4" onClick={() => setExpanded((value) => !value)}>
              {expanded ? t("review.showFewer") : t("review.viewAll")}
            </Button>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
