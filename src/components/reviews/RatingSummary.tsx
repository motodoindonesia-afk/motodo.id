import type { RatingBreakdown } from "../../types/review"
import { formatAverageRating } from "../../lib/reviews"
import { StarRating } from "./StarRating"

export function RatingSummary({
  title,
  average,
  count,
  breakdown,
  emptyLabel = "No reviews yet.",
}: {
  title?: string
  average: number | null
  count: number
  breakdown?: RatingBreakdown
  emptyLabel?: string
}) {
  const formatted = formatAverageRating(average)

  if (count === 0 || formatted === null) {
    return (
      <div>
        {title ? <h2 className="text-xl font-bold text-navy sm:text-2xl">{title}</h2> : null}
        <p className={title ? "mt-3 text-sm text-navy-muted" : "text-sm text-navy-muted"}>{emptyLabel}</p>
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
          <p className="text-lg font-semibold text-navy">{formatted} out of 5</p>
        </div>
        <p className="mt-1 text-sm text-navy-muted">Based on {count} {count === 1 ? "review" : "reviews"}</p>
      </div>
      {breakdown ? (
        <ul className="mt-5 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const amount = breakdown[star]
            const width = `${Math.round((amount / maxBar) * 100)}%`
            return (
              <li key={star} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-navy-muted">{star} {star === 1 ? "star" : "stars"}</span>
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
