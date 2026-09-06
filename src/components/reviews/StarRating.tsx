import { ratingLabel } from "../../lib/reviews"
import { cn } from "../../lib/cn"

type Props = {
  value: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: "sm" | "md"
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const interactive = Boolean(onChange) && !readOnly

  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
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
            aria-label={ratingLabel(star)}
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
