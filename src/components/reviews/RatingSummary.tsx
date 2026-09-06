import type { RatingBreakdown } from "../../types/review"
import { formatAverageRating } from "../../lib/reviews"
import { StarRating } from "./StarRating"
import { useT } from "../../i18n"

export function RatingSummary({
  title,
  average,
  count,
  breakdown,
  emptyLabel,
}: {
  title?: string
  average: number | null
  count: number
  breakdown?: RatingBreakdown
  emptyLabel?: string
}) {
  const t = useT()
  const formatted = formatAverageRating(average)
  const empty = emptyLabel ?? t("listing.noReviews")

  if (count === 0 || formatted === null) {
    return (
      <div>
        {title ? <h2 className="text-xl font-bold text-navy sm:text-2xl">{title}</h2> : null}
        <p className={title ? "mt-3 text-sm text-navy-muted" : "text-sm text-navy-muted"}>{empty}</p>
      </div>
    )
  }

  const maxBar = breakdown ? Math.max(breakdown[1], breakdown[2], breakdown[3], breakdown[4], breakdown[5], 1) : 1

  return (
    <div>
      {title ? <h2 className="text-xl font-bold text-navy sm:text-2xl">{title}</h2> : null}
      <div className={title ? "mt-4" : ""}>
        <div className="flex flex-wrap items-center gap-3">
          <StarRating value={Math.round(average ?? 0)} readOnly />
          <p className="text-lg font-semibold text-navy">{t("review.outOf5", { rating: formatted })}</p>
        </div>
        <p className="mt-1 text-sm text-navy-muted">
          {count === 1 ? t("review.basedOnOne") : t("review.basedOnMany", { count })}
        </p>
      </div>
      {breakdown ? (
        <ul className="mt-5 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const amount = breakdown[star]
            const width = `${Math.round((amount / maxBar) * 100)}%`
            return (
              <li key={star} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-navy-muted">{star === 1 ? t("review.starOne") : t("review.starMany", { count: star })}</span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-brand" style={{ width: amount ? width : "0%" }} />
                </div>
                <span className="w-6 shrink-0 text-right text-navy-muted">{amount}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
