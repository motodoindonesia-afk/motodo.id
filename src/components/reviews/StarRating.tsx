import { cn } from "../../lib/cn"
import { useT } from "../../i18n"

type Props = {
  value: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: "sm" | "md"
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const t = useT()
  const interactive = Boolean(onChange) && !readOnly

  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={t("review.starsAria", { value })}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        const className = cn(
          size === "sm" ? "text-base" : "text-xl",
          filled ? "text-brand" : "text-navy-muted/40",
          interactive && "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        )
        if (!interactive) {
          return (
            <span key={star} className={className} aria-hidden="true">
              {filled ? "★" : "☆"}
            </span>
          )
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={star === 1 ? t("review.starOne") : t("review.starRating", { count: star })}
            className={className}
            onClick={() => onChange?.(star)}
          >
            {filled ? "★" : "☆"}
          </button>
        )
      })}
    </div>
  )
}
