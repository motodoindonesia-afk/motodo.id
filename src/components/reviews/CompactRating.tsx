import { formatAverageRating } from "../../lib/reviews"
import { StarRating } from "./StarRating"
import { useT } from "../../i18n"

export function CompactRating({
  average,
  count,
  emptyLabel,
}: {
  average: number | null
  count: number
  emptyLabel: string
}) {
  const t = useT()
  const formatted = formatAverageRating(average)
  if (count === 0 || formatted === null) {
    return <p className="text-sm text-navy-muted">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StarRating value={Math.round(average ?? 0)} readOnly size="sm" />
      <span className="text-sm font-semibold text-navy">{formatted}</span>
      <span className="text-sm text-navy-muted">
        {count === 1 ? t("review.countOne") : t("review.countMany", { count })}
      </span>
    </div>
  )
}
