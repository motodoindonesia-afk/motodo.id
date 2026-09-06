import type { Review } from "../../types/review"
import { formatReviewMonth, getReviewPublicName } from "../../lib/reviews"
import { StarRating } from "./StarRating"
import { useT } from "../../i18n"

export function ReviewCard({
  review,
  listingName,
  showListing,
}: {
  review: Review
  listingName?: string
  showListing?: boolean
}) {
  const t = useT()
  const name = getReviewPublicName(review)

  return (
    <article className="rounded-2xl border border-line bg-white px-5 py-5 shadow-card">
      <StarRating value={review.rating} readOnly size="sm" />
      {review.title ? <h3 className="mt-2 font-semibold text-navy">{review.title}</h3> : null}
      <p className="mt-2 text-sm leading-relaxed text-navy-muted">“{review.comment}”</p>
      {showListing && listingName ? <p className="mt-2 text-sm text-navy">{listingName}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-navy-muted">
        <span className="font-medium text-navy">{name}</span>
        <span aria-hidden="true">·</span>
        <span>{formatReviewMonth(review.createdAt)}</span>
        <span className="rounded-full bg-surface px-2 py-0.5 font-medium text-navy">{t("review.verified")}</span>
      </div>
    </article>
  )
}
